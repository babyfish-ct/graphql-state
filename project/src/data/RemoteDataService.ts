import { ObjectFetcher } from "graphql-ts-client-api";
import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataRequest } from "./AbstractDataRequest";
import { AbstractDataService } from "./AbstractDataService";

export class RemoteDataService extends AbstractDataService {

    private pendingRequestMap = new Map<string, PendingRequest>();

    async query(args: QueryArgs): Promise<any> {
        const [promise, primary] = this.getPromise(args);
        const data = await promise;
        return this.standardizedResult(data, args, !primary);
    }

    private getPromise(args: QueryArgs): [Promise<void>, boolean] {
        let pendingRequest: PendingRequest | undefined = undefined;
        for (const [, request] of this.pendingRequestMap) {
            if (request.args.contains(args)) {
                pendingRequest = request;
                break;
            }
        }
        if (pendingRequest === undefined) {
            pendingRequest = new PendingRequest(this, args);
            this.pendingRequestMap.set(args.key, pendingRequest);
            pendingRequest.execute();
            return [pendingRequest.newPromise(), true];
        }
        return [pendingRequest.newPromise(), false];
    }

    onExecute(args: QueryArgs): Promise<any> {
        const network = this.entityManager.stateManager.network;
        if (network === undefined) {
            throw new Error(`Cannot execute remote data loading because network is not configured`);
        }
        return network.execute(
            args.fetcher as ObjectFetcher<'Query' | 'Mutation', any, any>, 
            args.optionsArgs?.variableArgs?.variables
        );
    }

    onExecuted(args: QueryArgs, data: any) {
        const entityManager = this.entityManager;
        const shape = args.shape;
        const ids = args.ids;
        if (ids === undefined) {
            entityManager.save(shape, data);
        } else {
            const objMap = this.toObjectMap(data, args);
            entityManager.modify(() => {
                for (const id of ids) {
                    const obj = objMap.get(id);
                    if (obj !== undefined) {
                        entityManager.save(shape, obj);
                    } else {
                        entityManager.delete(shape.typeName, id);
                    }
                }
            });
        }
    }

    onComplete(args: QueryArgs) {
        this.pendingRequestMap.delete(args.key);
    }
}

class PendingRequest extends AbstractDataRequest {}
