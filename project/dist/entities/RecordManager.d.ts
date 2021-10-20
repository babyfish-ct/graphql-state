import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { EntityManager } from "./EntityManager";
import { Record } from "./Record";
import { RecordRef } from "./RecordRef";
import { RuntimeShape } from "./RuntimeShape";
export declare class RecordManager {
    readonly entityManager: EntityManager;
    readonly type: TypeMetadata;
    private superManager?;
    private fieldManagerMap;
    private recordMap;
    constructor(entityManager: EntityManager, type: TypeMetadata);
    initializeOtherManagers(): void;
    findRefById(id: any): RecordRef | undefined;
    saveId(id: any): Record;
    save(shape: RuntimeShape, obj: any): void;
    delete(id: any): void;
    evict(id: any): void;
    private set;
}
