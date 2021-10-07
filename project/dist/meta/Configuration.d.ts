import { StateManager } from "../state/StateManager";
import { SchemaType } from "./SchemaType";
export interface Configuration<TSchema extends SchemaType> {
    bidirectionalAssociation<TTypeName extends keyof TSchema & string, TFieldName extends keyof TSchema[TTypeName][" $associations"] & string, TMappedByFieldName extends keyof TSchema[TSchema[TTypeName][" $associations"][TFieldName]][" $associations"] & string>(typeName: TTypeName, fieldName: TFieldName, mappedByFieldName: TMappedByFieldName): this;
    buildStateManager(): StateManager<TSchema>;
}
