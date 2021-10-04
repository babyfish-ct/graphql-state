import { FetchableType, Fetcher } from "graphql-ts-client-api";
import { StateManagerImpl } from "../../state/impl/StateManagerImpl";
import { StateManager } from "../../state/StateManager";
import { Configuration } from "../Configuration";
import { ScheamType } from "../SchemaType";
import { SchemaMetadata } from "./SchemaMetadata";

export function newConfiguration<TSchema extends ScheamType>(
    ...fethers: Fetcher<any, {}, {}>[]
): Configuration<TSchema> {
    return new ConfigurationImpl<TSchema>([]);
}

class ConfigurationImpl<TSchema extends ScheamType> implements Configuration<TSchema> {

    private schema = new SchemaMetadata();

    constructor(fetchableTypes: ReadonlyArray<FetchableType<string>>) {

    }

    buildStateManager(): StateManager<TSchema> {
        for (const [name, type] of this.schema.typeMap) {
            type.idField;
        }
        return new StateManagerImpl<TSchema>(this.schema);
    }
}
