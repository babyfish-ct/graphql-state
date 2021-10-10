import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { EntityManager } from "./EntityManager";
import { ModificationContext } from "./ModificationContext";
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
    saveId(ctx: ModificationContext, id: any): Record;
    save(ctx: ModificationContext, shape: RuntimeShape, obj: any): void;
    private set;
}
