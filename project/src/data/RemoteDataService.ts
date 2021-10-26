import { ObjectFetcher, util } from "graphql-ts-client-api";
import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataRequest } from "./AbstractDataRequest";
import { AbstractDataService } from "./AbstractDataService";

export class RemoteDataService extends AbstractDataService {

    private pendingRequestMap = new Map<string, PendingRequest>();

    async query(args: QueryArgs): Promise<void> {
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
        }
        return pendingRequest.newPromise(args);
    }

    async onExecute(args: QueryArgs): Promise<any> {
        const network = this.entityManager.stateManager.network;
        if (network === undefined) {
            throw new Error(`Cannot execute remote data loading because network is not configured`);
        }
        const data = util.exceptNullValues(
            await network.execute(
                args.fetcher as ObjectFetcher<'Query' | 'Mutation', any, any>, 
                args.optionsArgs?.variableArgs?.variables
            )
        );
        this.entityManager.save(args.shape, data);
        return data;
    }

    onComplete(args: QueryArgs) {
        this.pendingRequestMap.delete(args.key);
    }
}

class PendingRequest extends AbstractDataRequest {}
