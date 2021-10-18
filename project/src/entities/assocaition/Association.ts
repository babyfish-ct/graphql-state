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

    constructor(readonly field: FieldMetadata) {
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
        record: Record, 
        args: VariableArgs | undefined, 
        value: any
    ) {
        if (this.frozen) {
            throw new Error(`Cannot change the association because its frozen`);
        }
        this.frozen = true;
        try {
            this.value(args).set(entityManager, record, this.field, value);
        } finally {
            this.frozen = false;
        }
    }

    evict(args: VariableArgs | undefined) {
        this.valueMap.remove(args?.key);
    }

    link(
        entityManager: EntityManager, 
        self: Record, 
        target: Record | ReadonlyArray<Record>,
        mostStringentArgs: VariableArgs | undefined,
        changedByOpposite: boolean
    ) {
        if (!this.frozen || !changedByOpposite) {
            entityManager.modificationContext.update(self);
            this.valueMap.forEachValue(value => {
                if (mostStringentArgs?.key === value.args?.key && !changedByOpposite) {
                    return;
                }
                if (VariableArgs.contains(mostStringentArgs, value.args)) {
                    value.link(entityManager, self, this, target);
                } else if (Array.isArray(target)) {
                    const contains = this.field.associationProperties.contains;
                    const possibleRecords = Array.isArray(target) ? target : [target];
                    const targetRecords: Record[] = [];
                    let evict = false;
                    for (const possibleRecord of possibleRecords) {
                        const result = contains(possibleRecord.toRow(), value.args);
                        if (result === undefined || result === null) {
                            evict = true;
                            break;
                        }
                        if (result === true) {
                            targetRecords.push(possibleRecord);
                        }
                    }
                    if (evict) {
                        this.evict(value.args);
                    } else if (targetRecords.length !== 0) {
                        value.link(entityManager, self, this, targetRecords);
                    }
                }
            });
        }
    }

    unlink(
        entityManager: EntityManager, 
        self: Record, 
        target: Record | ReadonlyArray<Record>,
        leastStringentArgs: VariableArgs | undefined,
        changedByOpposite: boolean
    ) {
        if (!this.frozen || !changedByOpposite) {
            entityManager.modificationContext.update(self);
            this.valueMap.forEachValue(value => {
                if (leastStringentArgs?.key === value.args?.key && !changedByOpposite) {
                    return;
                }
                if (VariableArgs.contains(value.args, leastStringentArgs)) {
                    value.unlink(
                        entityManager, 
                        self, 
                        this, 
                        target
                    );
                } else {
                    this.evict(value.args);
                }
            });
        }
    }

    forceUnlink(
        entityManager: EntityManager, 
        self: Record, 
        target: Record
    ) {
        entityManager.modificationContext.update(self);
        this.valueMap.forEachValue(value => {
            value.unlink(
                entityManager, 
                self, 
                this, 
                target
            );
        });
    }

    private value(args: VariableArgs | undefined): AssociationValue {
        return this.valueMap.computeIfAbsent(args?.key, () => {
            switch (this.field.category) {
                case "CONNECTION":
                    return new AssociationConnectionValue(args);
                case "LIST":
                    return new AssociationListValue(args);
                default:
                    return new AssociationReferenceValue(args);
            }
        });
    }
}