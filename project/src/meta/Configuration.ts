import { ObjectFetcher, TextWriter, util } from "graphql-ts-client-api";
import { StateManager } from "../state/StateManager";
import { SchemaType } from "./SchemaType";

export interface Configuration<TSchema extends SchemaType> {

    bidirectionalAssociation<
        TTypeName extends keyof TSchema["entities"] & string, 
        TMappedByFieldName extends keyof TSchema["entities"][TTypeName][" $associationTypes"] & string, 
        TOppositeFieldName extends keyof TSchema["entities"][
            TSchema["entities"][TTypeName][" $associationTypes"][TMappedByFieldName]
        ][" $associationTypes"] & string
    >(
        typeName: TTypeName,
        mappedByFieldName: TMappedByFieldName,
        oppositeFieldName: TOppositeFieldName
    ): this;

    network(network: Network): this;

    buildStateManager(): StateManager<TSchema>;
}

export interface Network {

    execute<
        T extends object,
        TVariabes extends object
    >(
        fetcher: ObjectFetcher<'Query' | 'Mutation', T, TVariabes>,
        variables?: TVariabes
    ): Promise<T>;
}

export class GraphQLNetwork {

    constructor(private fetch: (body: string, variables?: object) => Promise<any>) {}

    async execute<
        TData extends object,
        TVariabes extends object
    >(
        fetcher: ObjectFetcher<'Query' | 'Mutation', TData, TVariabes>,
        variables?: TVariabes
    ): Promise<TData> {
        const writer = new TextWriter();
        writer.text(`${fetcher.fetchableType.name.toLowerCase()}`);
        if (fetcher.variableTypeMap.size !== 0) {
            writer.scope({type: "ARGUMENTS", multiLines: fetcher.variableTypeMap.size > 2, suffix: " "}, () => {
                for (const [name, type] of fetcher.variableTypeMap) {
                    writer.seperator();
                    writer.text(`$${name}: ${type}`);
                }
            });
        }
        writer.text(fetcher.toString());
        writer.text(fetcher.toFragmentString());

        const response = util.removeNullValues(await this.fetch(writer.toString(), variables ?? {}));
        if (response.errors) {
            throw new Error(response.errors);
        }
        return response.data as TData;
    }
}
