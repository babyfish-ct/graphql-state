import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { VariableArgs } from "../state/impl/Args";
import { EntityFieldVisitor, EntityManager } from "./EntityManager";
import { Record } from "./Record";
import { RecordRef } from "./RecordRef";
import { RuntimeShape } from "./RuntimeShape";
export declare class RecordManager {
    readonly entityManager: EntityManager;
    readonly type: TypeMetadata;
    private superManager?;
    private recordMap;
    constructor(entityManager: EntityManager, type: TypeMetadata);
    initializeOtherManagers(): void;
    findRefById(id: any): RecordRef | undefined;
    saveId(id: any, runtimeType: TypeMetadata): Record;
    private insertId;
    visit(shape: RuntimeShape, obj: any, runtimeTypeOrName: TypeMetadata | string, visitor: EntityFieldVisitor): void;
    delete(id: any): void;
    evict(id: any): void;
    forEach(visitor: (record: Record) => boolean | void): void;
    set(id: any, runtimeType: TypeMetadata, field: FieldMetadata, args: VariableArgs | undefined, value: any): void;
    markGarableFlag(): void;
}
