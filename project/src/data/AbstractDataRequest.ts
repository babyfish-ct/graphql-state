import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataService } from "./AbstractDataService";

export abstract class AbstractDataRequest {

    private joinedResolvers: JoinedResolver[] = [];

    constructor(
        private dataService: AbstractDataService,
        protected _args: QueryArgs
    ) {}

    async execute() {
        let data: any
        try {
            data = await (this.dataService as any).onLoad(this.args);
            if (typeof data !== 'object' || data  === null) {
                throw new Error("The remote loader must return an object");
            }
            (this.dataService as any).onLoaded(this.args, data);
        } catch (ex) {
            this.reject(ex);
            return;
        } finally {
            this.dataService[" $unregister"](this.args);
        }
        this.resolve(data);
    }

    newPromise(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.joinedResolvers.push({resolve, reject});
        });
    }

    get args(): QueryArgs {
        return this._args;
    }

    private resolve(data: any) {
        for (const resolver of this.joinedResolvers) {
            try {
                resolver.resolve(data);
            } catch (ex) {
                console.warn(ex);
            }
        }
    }

    private reject(error: any) {
        for (const resolver of this.joinedResolvers) {
            try {
                resolver.reject(error);
            } catch (ex) {
                console.warn(ex);
            }
        }
    }
}

interface JoinedResolver {
    resolve(data: any): void;
    reject(error: any): void;
}