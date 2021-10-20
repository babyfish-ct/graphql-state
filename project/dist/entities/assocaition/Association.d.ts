import { FieldMetadata } from "../../meta/impl/FieldMetadata";
import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { VariableArgs } from "../VariableArgs";
import { RecordConnection } from "./AssociationConnectionValue";
export declare class Association {
    readonly record: Record;
    readonly field: FieldMetadata;
    private valueMap;
    private frozen;
    constructor(record: Record, field: FieldMetadata);
    has(args: VariableArgs | undefined): boolean;
    get(args: VariableArgs | undefined): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined;
    set(entityManager: EntityManager, args: VariableArgs | undefined, value: any): void;
    evict(entityManager: EntityManager, args: VariableArgs | undefined): void;
    link(entityManager: EntityManager, target: Record | ReadonlyArray<Record>, mostStringentArgs: VariableArgs | undefined, changedByOpposite: boolean): void;
    unlink(entityManager: EntityManager, target: Record | ReadonlyArray<Record>, leastStringentArgs: VariableArgs | undefined, changedByOpposite: boolean): void;
    forceUnlink(entityManager: EntityManager, target: Record): void;
    appendTo(map: Map<string, any>): void;
    dispose(entityManager: EntityManager): void;
    private value;
}
