import { FieldMetadata } from "../../meta/impl/FieldMetadata";
import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { VariableArgs } from "../VariableArgs";
import { RecordConnection } from "./AssociationConnectionValue";
export declare class Association {
    readonly field: FieldMetadata;
    private valueMap;
    private frozen;
    constructor(field: FieldMetadata);
    has(args: VariableArgs | undefined): boolean;
    get(args: VariableArgs | undefined): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined;
    set(entityManager: EntityManager, record: Record, args: VariableArgs | undefined, value: any): void;
    evict(args: VariableArgs | undefined): void;
    link(entityManager: EntityManager, self: Record, target: Record | ReadonlyArray<Record>, mostStringentArgs: VariableArgs | undefined, changedByOpposite: boolean): void;
    unlink(entityManager: EntityManager, self: Record, target: Record | ReadonlyArray<Record>, leastStringentArgs: VariableArgs | undefined, changedByOpposite: boolean): void;
    forceUnlink(entityManager: EntityManager, self: Record, target: Record): void;
    appendTo(map: Map<string, any>): void;
    private value;
}
