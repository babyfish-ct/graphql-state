import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataService } from "./AbstractDataService";
import { ObjectFilter, reshapeObject } from "./util";

export abstract class AbstractDataRequest {

    private _joinedResolvers: JoinedResolver[] = [];

    constructor(
        protected _dataService: AbstractDataService,
        protected _args: QueryArgs
    ) {
    }

    async execute() {
        let data: any
        try {
            data = await (this._dataService as any).onExecute(this._args);
            if (typeof data !== 'object' || data  === null) {
                throw new Error("The remote loader must return an object");
            }
        } catch (ex) {
            this.reject(ex);
            return;
        } finally {
            this._dataService.onComplete(this._args);
        }
        this.resolve(data);
    }

    newPromise(args: QueryArgs): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._joinedResolvers.push({args, resolve, reject});
        });
    }

    get args(): QueryArgs {
        return this._args;
    }

    private resolve(data: any) {
        const filter = new ObjectFilter(
            this._dataService.entityManager.schema, 
            data, 
            this._args.ids, 
            this._args.shape
        );
        for (const resolver of this._joinedResolvers) {
            try {
                const filtered = filter.get(resolver.args.ids);
                let reshaped = this.reshape(filtered, resolver.args);
                resolver.resolve(reshaped);
            } catch (ex) {
                console.warn(ex);
            }
        }
    }

    private reject(error: any) {
        for (const resolver of this._joinedResolvers) {
            try {
                resolver.reject(error);
            } catch (ex) {
                console.warn(ex);
            }
        }
    }

    private reshape(data: any, args: QueryArgs): any {
        if (this._args.shape.toString() === args.shape.toString()) {
            return data;
        } 
        return reshapeObject(
            this._dataService.entityManager.schema, 
            data, 
            args.shape
        );
    }
}


interface JoinedResolver {
    args: QueryArgs;
    resolve(data: any): void;
    reject(error: any): void;
}