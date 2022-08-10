import { TypeMetadata } from "../../meta/impl/TypeMetdata";
import { EntityChangeEvent, EntityEvictEvent, EntityKey } from "../EntityEvent";
import { EntityManager } from "../EntityManager";
import { Record, FlatRowImpl, QUERY_OBJECT_ID } from "../Record";
import { VariableArgs } from "../../state/impl/Args";
import { Association } from "./Association";
import { ObjectConnection, RecordConnection } from "./AssociationConnectionValue";
import { Pagination } from "../QueryArgs";
import { isEvictLogEnabled, EvictReasonType } from "../../state/Monitor";

export abstract class AssociationValue {

    private dependencies?: ReadonlySet<string> | "all";

    gcVisited = false;

    constructor(
        readonly association: Association,
        readonly args?: VariableArgs
    ) {
        const deps = association.field.associationProperties!.dependencies(args?.filterVariables);
        if (deps === undefined || deps === null || deps.length !== 0) {
            this.dependencies = deps === undefined || deps === null ? "all" : new Set(deps);
        }
    }

    abstract getAsObject(): any | ReadonlyArray<any> | ObjectConnection | undefined;

    abstract get(): Record | ReadonlyArray<Record> | RecordConnection | undefined;

    abstract set(
        entityManager: EntityManager, 
        value: any,
        pagination?: Pagination
    ): void;

    abstract link(
        entityManager: EntityManager, 
        targets: ReadonlyArray<Record>
    ): void;

    abstract unlink(
        entityManager: EntityManager, 
        targets: ReadonlyArray<Record>
    ): void;

    abstract contains(target: Record): boolean;

    protected abstract reorder(entityManager: EntityManager, target: Record): void;

    protected releaseOldReference(
        entityManager: EntityManager,
        oldReference: Record | undefined
    ) {
        const self = this.association.record;
        if (oldReference !== undefined && self.id !== QUERY_OBJECT_ID) {
            oldReference.backReferences.remove(
                this.association.field, 
                this.args,
                self
            );
            this.association.unlink(entityManager, oldReference, this.args, true);
            if (!entityManager.isBidirectionalAssociationManagementSuspending) {
                const oppositeField = this.association.field.oppositeField;
                if (oppositeField !== undefined && this.args === undefined) {
                    if (oldReference) {
                        oldReference.unlink(entityManager, oppositeField, self);
                    }
                }
            }
        }
    }

    protected retainNewReference(
        entityManager: EntityManager,
        newReference: Record | undefined
    ) {
        const self = this.association.record;
        if (newReference !== undefined && self.id !== QUERY_OBJECT_ID) {
            newReference.backReferences.add(
                this.association.field, 
                this.args,
                self
            );
            this.association.link(entityManager, newReference, this.args, true);
            if (!entityManager.isBidirectionalAssociationManagementSuspending) {
                const oppositeField = this.association.field.oppositeField;
                if (oppositeField !== undefined) {
                    newReference.link(entityManager, oppositeField, self);
                    if (oppositeField.category === "REFERENCE" && !newReference.hasAssociation(oppositeField)) {
                        entityManager.forEach(this.association.field.declaringType.name, record => {
                            if (record.id !== this.association.record.id &&
                                record.contains(this.association.field, undefined, newReference, true)
                            ) {
                                record.unlink(entityManager, this.association.field, newReference);
                            }
                        });
                    }
                }
            }
        }
    }

    referesh(entityManager: EntityManager, e: EntityEvictEvent | EntityChangeEvent) {
        if (e.eventType === "evict") {
            this.refreshByEvictEvent(entityManager, e);
        } else if (e.eventType === "change") {
            this.refreshByChangeEvent(entityManager, e);
        }
    }

    private refreshByEvictEvent(entityManager: EntityManager, e: EntityEvictEvent) {
        if (!e.causedByGC) {
            const targetType = this.association.field.targetType!;
            const actualType = entityManager.schema.typeMap.get(e.typeName)!;
            if (targetType!.isAssignableFrom(actualType)) {
                if (e.evictedType === 'row' || this.isTargetChanged(targetType, e.evictedKeys)) {
                    this.evict(entityManager);
                }
            }
        }
    }

    private refreshByChangeEvent(entityManager: EntityManager, e: EntityChangeEvent) {
        const targetType = this.association.field.targetType!;
        const actualType = entityManager.schema.typeMap.get(e.typeName)!;
        if (targetType!.isAssignableFrom(actualType) && (
            (e.changedType === "update" && this.isTargetChanged(targetType, e.changedKeys)) ||
            e.changedType === "insert")
        ) {
            const ref = entityManager.findRefById(targetType.name, e.id);
            if (ref?.value !== undefined) {
                const belongToMe = this.belongToMe(ref.value);
                if (belongToMe === false) {
                    return;
                }
                let evictReason: EvictReasonType | undefined = undefined;
                if (belongToMe === true) { 
                    const result = this.association.field.associationProperties?.contains(
                        new FlatRowImpl(ref.value),
                        this.args?.filterVariables
                    );
                    if (result === true) {
                        if (this.contains(ref.value)) {
                            if (this.association.field.isPositionConfigured) {
                                this.reorder(entityManager, ref.value);
                            }
                        } else {
                            this.link(entityManager, [ref.value]);
                        }
                        return;
                    }
                    if (result === false) {
                        this.unlink(entityManager, [ref.value]);
                        return;
                    }
                    evictReason = this.association.unfilterableReason;
                } else if (isEvictLogEnabled()) {
                    evictReason = "unknown-owner"
                }
                this.evict(entityManager, evictReason);
            }
        }
    }

    private isTargetChanged(targetType: TypeMetadata, keys: ReadonlyArray<EntityKey>) {
        for (const key of keys) {
            if (typeof key === "string") {
                if (this.dependencies === "all") {
                    return true;
                }
                if (this.dependencies?.has(key) === true) {
                    return true;
                }
            }
        }
        return false;
    }

    private belongToMe(target: Record): boolean | undefined {
        if (this.association.record.runtimeType.name === "Query") {
            return true;
        }
        if (this.association.anyValueContains(target)) {
            return true;
        }
        const oppositeField = this.association.field.oppositeField;
        if (oppositeField !== undefined) {
            const oppositeReferenceMe = target.anyValueContains(oppositeField, this.association.record);
            if (oppositeReferenceMe !== undefined) {
                return oppositeReferenceMe;
            }
        }
        return undefined;
    }

    evict(entityManager: EntityManager, evictReason?: EvictReasonType) {
        this.association.evict(entityManager, this.args, false, evictReason);
    }

    get isLinkOptimizable(): [boolean, EvictReasonType | undefined] {
        const paginationInfo = this.args?.paginationInfo;
        if (paginationInfo?.style === "page") {
            let evictReason: EvictReasonType | undefined = undefined;
            if (isEvictLogEnabled()) {
                evictReason = "page-style-pagination";
            }
            return [false, evictReason];
        }
        if (paginationInfo !== undefined && this.association.field.associationProperties?.range === undefined) {
            let evictReason: EvictReasonType | undefined = undefined;
            if (isEvictLogEnabled()) {
                evictReason = "no-range";
            }
            return [false, evictReason];
        }
        return [true, undefined];
    }
}
