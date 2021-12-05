import { EntityChangeEvent } from "..";
import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { VariableArgs } from "../state/impl/Args";
import { compare } from "../state/impl/util";
import { GraphObject, GraphType } from "../state/Monitor";
import { EntityManager, Garbage } from "./EntityManager";
import { Pagination } from "./QueryArgs";
import { Record } from "./Record";
import { RecordRef } from "./RecordRef";

export class RecordManager {

    private superManager?: RecordManager;

    private recordMap = new Map<any, Record>();

    constructor(
        readonly entityManager: EntityManager,
        readonly type: TypeMetadata
    ) {}

    initializeOtherManagers() {
        if (this.type.superType !== undefined) {
            this.superManager = this.entityManager.recordManager(this.type.superType.name);
        }
    }

    findRefById(id: any): RecordRef | undefined {
        const record = this.recordMap.get(id);
        if (record === undefined) {
            return undefined;
        }
        return record.isDeleted ? {} : { value: record };
    }

    saveId(id: any, runtimeType: TypeMetadata): Record {
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            if (record.runtimeType === runtimeType) {
                if (record.undelete()) {
                    this.entityManager.modificationContext.insert(record);  
                }
                return record;
            }
            this.entityManager.delete(record.runtimeType.name, record.id);
        }
        record = this.insertId(id, runtimeType);
        this.entityManager.modificationContext.insert(record);
        return record;
    }

    private insertId(id: any, runtimeType: TypeMetadata, deleted: boolean = false): Record {
        const superRecord = this.superManager?.insertId(id, runtimeType);
        const record = new Record(superRecord, this.type, runtimeType, id, deleted);
        this.recordMap.set(id, record);
        return record;
    }

    delete(id: any) {
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            this.entityManager.modificationContext.delete(record);
            record.delete(this.entityManager);
        } else {
            this.insertId(id, this.type, true);
        }
        this.superManager?.delete(id);
    }

    evict(id: any) {
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            this.entityManager.modificationContext.evict(record);
            this.recordMap.delete(id);
            record.dispose(this.entityManager);
        }
        this.superManager?.evict(id);
    }

    forEach(visitor: (record: Record) => boolean | void) {
        for (const [, record] of this.recordMap) {
            if (visitor(record) === false) {
                break;
            }
        }
    }

    set(
        id: any, 
        runtimeType: TypeMetadata,
        field: FieldMetadata,
        args: VariableArgs | undefined, 
        value: any,
        pagination?: Pagination
    ) {
        const record = this.saveId(id, runtimeType);
        record.set(this.entityManager, field, args, value, pagination);
    }

    refresh(field: FieldMetadata, e: EntityChangeEvent) {
        for (const record of this.recordMap.values()) {
            if (!record.isDeleted) {
                record.refreshByChangeEvent(this.entityManager, field, e);
            }
        }
    }

    collectGarbages(output: Garbage[]) {
        for (const record of this.recordMap.values()) {
            if (record.staticType === record.runtimeType) {
                record.collectGarbages(output);
            }
        }
    }

    monitor(): GraphType | undefined {
        const objects: GraphObject[] = [];
        for (const record of this.recordMap.values()) {
            if (!record.isDeleted) {
                objects.push(record.monitor());
            }
        }
        if (objects.length === 0) {
            return undefined;
        }
        objects.sort((a, b) => compare(a, b, "id"));
        const type: GraphType = {
            name: this.type.name,
            objects
        };
        return type;
    }
}

