import { StateManager } from "../state/StateManager";
import { SchemaType } from "./SchemaType";

export interface Configuration<TSchema extends SchemaType> {

    bidirectionalAssociation<
        TTypeName extends keyof TSchema & string, 
        TMappedByFieldName extends keyof TSchema[TTypeName][" $associations"] & string, 
        TOppositeFieldName extends keyof TSchema[TSchema[TTypeName][" $associations"][TMappedByFieldName]][" $associations"] & string
    >(
        typeName: TTypeName,
        mappedByFieldName: TMappedByFieldName,
        oppositeFieldName: TOppositeFieldName
    ): this;

    buildStateManager(): StateManager<TSchema>;
}
