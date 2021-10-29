import { TypeMetadata } from "../../meta/impl/TypeMetdata";
import { EntityChangeEvent, EntityEvictEvent, EntityKey } from "../EntityEvent";
import { EntityManager } from "../EntityManager";
import { Record, ScalarRowImpl } from "../Record";
import { VariableArgs } from "../../state/impl/Args";
import { Association } from "./Association";
import { ObjectConnection, RecordConnection } from "./AssociationConnectionValue";

export abstract class AssociationValue {

    private dependencies?: ReadonlySet<string> | "all";

    isGarbage = false;

    constructor(
        entityManager: EntityManager,
        readonly association: Association,
        readonly args?: VariableArgs
    ) {
        const deps = association.field.associationProperties!.dependencies(args?.variables);
        if (deps === undefined || deps === null || deps.length !== 0) {
            this.dependencies = deps === undefined || deps === null ? "all" : new Set(deps);
            entityManager.addAssociationValueObserver(this);
        }
    }

    abstract getAsObject(): any | ReadonlyArray<any> | ObjectConnection | undefined;

    abstract get(): Record | ReadonlyArray<Record> | RecordConnection | undefined;

    abstract set(
        entityManager: EntityManager, 
        value: any
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

    protected releaseOldReference(
        entityManager: EntityManager,
        oldReference: Record | undefined
    ) {
        const self = this.association.record;
        if (oldReference !== undefined) {
            oldReference.backReferences.remove(
                this.association.field, 
                this.args,
                self
            );
            this.association.unlink(entityManager, oldReference, this.args, true);
            if (!entityManager.isBidirectionalAssociationManagementSuspending) {
                const oppositeField = this.association.field.oppositeField;
                if (oppositeField !== undefined) {
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
        if (newReference !== undefined) {
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

    dispose(entityManager: EntityManager) {
        if (this.dependencies !== undefined) {
            entityManager.removeAssociationValueObserver(this);
        }
    }

    onEntityEvict(entityManager: EntityManager, e: EntityEvictEvent) {
        const targetType = this.association.field.targetType!;
        const actualType = entityManager.schema.typeMap.get(e.typeName)!;
        if (targetType!.isAssignableFrom(actualType)) {
            if (e.evictedType === 'row' || this.isTargetChanged(targetType, e.evictedKeys)) {
                this.evict(entityManager);
            }
        }
    }

    onEntityChange(entityManager: EntityManager, e: EntityChangeEvent) {
        const declaredTypeName = this.association.field.declaringType.name;
        const targetType = this.association.field.targetType!;
        const actualType = entityManager.schema.typeMap.get(e.typeName)!;
        if (targetType!.isAssignableFrom(actualType) && 
        e.changedType === "update" &&
        this.isTargetChanged(targetType, e.changedKeys)) {
            if (declaredTypeName === "Query" && this.association.field.isContainingConfigured) {
                const ref = entityManager.findRefById(targetType.name, e.id);
                if (ref?.value !== undefined) {
                    const fieldNames = Array.isArray(this.dependencies) ? 
                        this.dependencies :
                        Array.from(targetType.fieldMap.values())
                        .filter(field => field.category === "SCALAR")
                        .map(field => field.name);
                    const map = new Map<string, any>();
                    for (const fieldName of fieldNames) {
                        if (e.has(fieldName)) {
                            map.set(fieldName, e.newValue(fieldName));
                        }
                    }
                    const result = this.association.field.associationProperties?.contains(
                        new ScalarRowImpl(map),
                        this.args?.variables
                    );
                    if (result === true) {
                        // Cannot invoke "this.link" directly
                        this.association.link(entityManager, ref.value, this.args);
                        return;
                    }
                    if (result === false) {
                        // Cannot invoke "this.unlink" directly
                        this.association.unlink(entityManager, ref.value, this.args);
                        return;
                    }
                }
            }
            this.evict(entityManager);
        }
    }

    private isTargetChanged(targetType: TypeMetadata, keys: ReadonlyArray<EntityKey>) {
        for (const key of keys) {
            if (typeof key === "string" && targetType.fieldMap.get(key)?.category === "SCALAR") {
                if (this.dependencies === "all") {
                    return true;
                }
                if (this.dependencies?.has(key) === true) {
                    return true;
                }
            }
        }
    }

    protected evict(entityManager: EntityManager) {
        this.association.evict(entityManager, this.args, false);
    }
}
