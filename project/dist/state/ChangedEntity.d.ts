import { ObjectType } from "../meta/SchemaTypes";
export interface EntityChangedEvent<TEntity extends ObjectType> {
    readonly typeName: string;
    readonly id: any;
    readonly changedType: ChangedType;
    readonly fieldNames: ReadonlySet<keyof TEntity>;
    oldValue<TFieldName extends keyof TEntity>(fieldName: TFieldName): TEntity[TFieldName] | undefined;
    newValue<TFieldName extends keyof TEntity>(fieldName: TFieldName): TEntity[TFieldName] | undefined;
}
export declare type ChangedType = "INSERT" | "UPDATE" | "DELETE";
