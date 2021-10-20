import { FieldMetadata } from "../../meta/impl/FieldMetadata";
import { SpaceSavingMap } from "../../state/impl/SpaceSavingMap";
import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { VariableArgs } from "../VariableArgs";
import { AssociationValue } from "./AssocaitionValue";
import { AssociationConnectionValue, RecordConnection } from "./AssociationConnectionValue";
import { AssociationListValue } from "./AssociationListValue";
import { AssociationReferenceValue } from "./AssociationReferenceValue";

export class Association {

    private valueMap = new SpaceSavingMap<string | undefined, AssociationValue>();

    private frozen = false;

    constructor(
        readonly record: Record,
        readonly field: FieldMetadata
    ) {
        if (field.category === "ID") {
            throw new Error("Internal bug: assocaition base on id field");
        }
    }

    has(args: VariableArgs | undefined): boolean {
        return this.valueMap.get(args?.key) !== undefined;
    }

    get(args: VariableArgs | undefined): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined {
        return this.valueMap.get(args?.key)?.get();
    }

    set(
        entityManager: EntityManager, 
        args: VariableArgs | undefined, 
        value: any
    ) {
        if (this.frozen) {
            this.value(entityManager, args).set(entityManager, value);
        } else {
            this.frozen = true;
            try {
                this.value(entityManager, args).set(entityManager, value);
            } finally {
                this.frozen = false;
            }
        }
    }

    evict(
        entityManager: EntityManager, 
        args: VariableArgs | undefined,
        includeMoreStrictArgs: boolean
    ) {
        const ctx = entityManager.modificationContext;
        if (includeMoreStrictArgs) {
            const keys: Array<string | undefined> = [];
            this.valueMap.forEachValue(value => {
                if (VariableArgs.contains(value.args, args)) {
                    ctx.unset(this.record, this.field.name, value.args);
                    value.dispose(entityManager);
                    keys.push(args?.key);
                }
            });
            for (const key of keys) {
                this.valueMap.remove(key);
            }
        } else {
            const value = this.valueMap.get(args?.key);
            if (value !== undefined) {
                ctx.unset(this.record, this.field.name, value.args);
                value.dispose(entityManager);
                this.valueMap.remove(args?.key);
            }
        }
    }

    contains(args: VariableArgs | undefined, target: Record, tryMoreStrictArgs): boolean {
        if (!tryMoreStrictArgs) {
            return this.valueMap.get(args?.key)?.contains(target) === true;
        }
        let result = false;
        this.valueMap.forEachValue(value => {
            if (VariableArgs.contains(value.args, args)) {
                if (value.contains(target)) {
                    result = true;
                    return false;
                }
            }
        });
        return result;
    }

    link(
        entityManager: EntityManager, 
        target: Record | ReadonlyArray<Record>,
        mostStringentArgs: VariableArgs | undefined,
        changedByOpposite: boolean
    ) {
        if (!this.frozen || !changedByOpposite) {
            entityManager.modificationContext.update(this.record);
            this.valueMap.forEachValue(value => {
                if (mostStringentArgs?.key === value.args?.key && !changedByOpposite) {
                    return;
                }
                if (VariableArgs.contains(mostStringentArgs, value.args)) {
                    value.link(entityManager, target);
                } else {
                    const contains = this.field.associationProperties!.contains;
                    const possibleRecords = Array.isArray(target) ? target : [target];
                    const targetRecords: Record[] = [];
                    let evict = false;
                    for (const possibleRecord of possibleRecords) {
                        const result = contains(possibleRecord.toRow(), value.args?.variables);
                        if (result === undefined) {
                            evict = true;
                            break;
                        }
                        if (result === true) {
                            targetRecords.push(possibleRecord);
                        }
                    }
                    if (evict) {
                        this.evict(entityManager, value.args, false);
                    } else if (targetRecords.length !== 0) {
                        value.link(entityManager, targetRecords);
                    }
                }
            });
        }
    }

    unlink(
        entityManager: EntityManager, 
        target: Record | ReadonlyArray<Record>,
        leastStringentArgs: VariableArgs | undefined,
        changedByOpposite: boolean
    ) {
        if (!this.frozen || !changedByOpposite) {
            entityManager.modificationContext.update(this.record);
            this.valueMap.forEachValue(value => {
                if (leastStringentArgs?.key === value.args?.key && !changedByOpposite) {
                    return;
                }
                if (VariableArgs.contains(value.args, leastStringentArgs)) {
                    value.unlink(
                        entityManager, 
                        target
                    );
                } else {
                    this.evict(entityManager, value.args, false);
                }
            });
        }
    }

    forceUnlink(
        entityManager: EntityManager, 
        target: Record
    ) {
        entityManager.modificationContext.update(this.record);
        this.valueMap.forEachValue(value => {
            value.unlink(
                entityManager, 
                target
            );
        });
    }

    appendTo(map: Map<string, any>) {
        const idFieldName = this.field.targetType!.idField.name;
        this.valueMap.forEachValue(value => {
            map.set(
                VariableArgs.fieldKey(this.field.name, value.args), 
                value.getAsObject()
            );
        });
    }

    dispose(entityManager: EntityManager) {
        this.valueMap.forEachValue(value => {
            value.dispose(entityManager);
        })
    }

    private value(entityManager: EntityManager, args: VariableArgs | undefined): AssociationValue {
        return this.valueMap.computeIfAbsent(args?.key, () => {
            switch (this.field.category) {
                case "CONNECTION":
                    return new AssociationConnectionValue(entityManager, this, args);
                case "LIST":
                    return new AssociationListValue(entityManager, this, args);
                default:
                    return new AssociationReferenceValue(entityManager, this, args);
            }
        });
    }
}