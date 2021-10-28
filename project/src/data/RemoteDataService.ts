import { Fetcher, ObjectFetcher, util } from "graphql-ts-client-api";
import { EntityManager } from "../entities/EntityManager";
import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataRequest } from "./AbstractDataRequest";
import { AbstractDataService } from "./AbstractDataService";

export class RemoteDataService extends AbstractDataService {

    private pendingRequestMap = new Map<string, PendingRequest>();

    private objectFetcherCreator?: (
        fetcher: Fetcher<string, object, object>
    ) => ObjectFetcher<"Query", object, object>;

    constructor(entityManager: EntityManager) {
        super(entityManager);
        const queryFetcher = entityManager.schema.fetcher("Query");
        if (queryFetcher !== undefined) {
            const entitiesField = queryFetcher.fetchableType.fields.get("entities");
            if (entitiesField !== undefined) {
                if (entitiesField.category !== "LIST") {
                    throw new Error(`"Query.entities" must returns list`);
                }
                const nodeFetcher = this.entityManager.schema.fetcher(entitiesField.targetTypeName!);
                if (nodeFetcher === undefined) {
                    throw new Error(`Internal bug: No fetcher for the returned type of "Query.entities"`);
                }
                if (entitiesField.argGraphQLTypeMap.size !== 2) {
                    throw new Error(`"Query.entities" should contains 2 arguments named "typeName" and "ids"`);
                }
                const typeNameType = entitiesField.argGraphQLTypeMap.get("typeName");
                const idsType = entitiesField.argGraphQLTypeMap.get("ids");
                if (typeNameType === undefined || idsType === undefined) {
                    throw new Error(`"Query.entities" should contains 2 arguments named "typeName" and "ids"`);
                }
                if (typeNameType !== "String!") {
                    throw new Error(`The type of the argument "typeName" of "Query.entities" must be "String!"`);
                }
                if (!idsType.endsWith("!]!")) {
                    throw new Error(`The type of the argument "ids" of "Query.entities" must be non-null list with non-null elements`);
                }
                this.objectFetcherCreator = (fetcher: Fetcher<string, object, object>) => {
                    return (queryFetcher as any).entities(
                        (nodeFetcher as any).on(
                            fetcher
                        )
                    );
                };
            }
        }
    }

    async query(args: QueryArgs): Promise<void> {
        let pendingRequest: PendingRequest | undefined = undefined;
        for (const [, request] of this.pendingRequestMap) {
            console.log("try merge");
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
        let data: any = util.exceptNullValues(
            await this.executeNetworkQuery(args) 
        );
        this.entityManager.save(args.shape, data);
        return data;
    }

    onComplete(args: QueryArgs) {
        this.pendingRequestMap.delete(args.key);
    }

    private async executeNetworkQuery(args: QueryArgs): Promise<any> {
        
        const network = this.entityManager.stateManager.network;
        if (network === undefined) {
            throw new Error(`Cannot execute remote data loading because network is not configured`);
        }

        if (args.ids === undefined) {
            return await network.execute(
                args.fetcher as ObjectFetcher<'Query' | 'Mutation', any, any>, 
                args.optionsArgs?.variableArgs?.variables
            )
        }

        if (this.objectFetcherCreator === undefined) {
            throw new Error(
                `The object(s) query is not supported because there is no field "Query.entities"`
            );
        }
        const data = await network.execute(
            this.objectFetcherCreator(args.fetcher),
            { 
                ...args.optionsArgs?.variableArgs, 
                typeName: args.fetcher.fetchableType.name,
                ids: args.ids 
            }
        )
        return (data as any).entities;
    }
}

class PendingRequest extends AbstractDataRequest {}
