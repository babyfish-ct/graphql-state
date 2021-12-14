import { FieldMetadata } from "../../meta/impl/FieldMetadata";
import { SpaceSavingMap } from "../../state/impl/SpaceSavingMap";
import { EntityManager, Garbage } from "../EntityManager";
import { Record } from "../Record";
import { VariableArgs } from "../../state/impl/Args";
import { AssociationValue } from "./AssocaitionValue";
import { AssociationConnectionValue, RecordConnection } from "./AssociationConnectionValue";
import { AssociationListValue } from "./AssociationListValue";
import { AssociationReferenceValue } from "./AssociationReferenceValue";
import { Pagination } from "../QueryArgs";
import { TextWriter } from "graphql-ts-client-api";
import { EntityChangeEvent, EntityEvictEvent } from "../EntityEvent";
import { GraphField, ParameterizedValue, GraphValue, isEvictLogEnabled, EvictReasonType } from "../../state/Monitor";
import { compare } from "../../state/impl/util";

export class Association {

    private valueMap = new SpaceSavingMap<string | undefined, AssociationValue>();

    private linkChanging = false;

    private refreshedVersion = 0;

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

    contains(args: VariableArgs | undefined, target: Record, tryMoreStrictArgs: boolean): boolean {
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

    anyValueContains(target: Record): boolean | undefined {
        let result = false;
        this.valueMap.forEachValue(value => {
            if (value.contains(target)) {
                result = true;
                return false;
            }
        });
        if (result) {
            return true;
        }
        return this.valueMap.get(undefined) !== undefined ? false : undefined;
    }

    set(
        entityManager: EntityManager, 
        args: VariableArgs | undefined, 
        value: any,
        pagination?: Pagination
    ) {
        this.refreshedVersion = entityManager.modificationVersion;
        this.value(args).set(entityManager, value, pagination);
    }

    evict(
        entityManager: EntityManager, 
        args: VariableArgs | undefined,
        includeMoreStrictArgs: boolean,
        evictReason?: EvictReasonType
    ) {
        this.refreshedVersion = entityManager.modificationVersion;
        const ctx = entityManager.modificationContext;
        if (includeMoreStrictArgs) {
            const keys: Array<string | undefined> = [];
            this.valueMap.forEachValue(value => {
                if (VariableArgs.contains(value.args, args)) {
                    ctx.unset(this.record, this.field.name, value.args, evictReason);
                    keys.push(args?.key);
                }
            });
            for (const key of keys) {
                this.valueMap.remove(key);
            }
        } else {
            const value = this.valueMap.get(args?.key);
            if (value !== undefined) {
                ctx.unset(this.record, this.field.name, value.args, evictReason);
                this.valueMap.remove(args?.key);
            }
        }
    }

    link(
        entityManager: EntityManager, 
        target: Record | ReadonlyArray<Record>,
        mostStringentArgs: VariableArgs | undefined,
        insideModification: boolean = false
    ) {
        this.refreshedVersion = entityManager.modificationVersion;
        this.changeLinks(() => {
            for (const value of this.valueMap.cloneValues()) {
                if (insideModification && mostStringentArgs?.key === value.args?.key) {
                    return;
                }
                const possibleRecords = 
                    (Array.isArray(target) ? target : [target])
                    .filter(target => !value.contains(target));
                if (possibleRecords.length === 0) {
                    return;
                }
                const [isLinkOptimizable, unoptimizableReason] = value.isLinkOptimizable;
                if (!isLinkOptimizable) {
                    this.evict(entityManager, value.args, false, unoptimizableReason);
                } else if (VariableArgs.contains(mostStringentArgs?.filterArgs, value.args?.filterArgs)) {
                    value.link(entityManager, possibleRecords);
                } else {
                    const contains = this.field.associationProperties!.contains;
                    const exactRecords: Record[] = [];
                    let evict = false;
                    for (const possibleRecord of possibleRecords) {
                        const result = contains(possibleRecord.toRow(), value.args?.filterVariables);
                        if (result === undefined) {
                            evict = true;
                            break;
                        }
                        if (result === true) {
                            exactRecords.push(possibleRecord);
                        }
                    }
                    if (evict) {
                        this.evict(entityManager, value.args, false, this.unfilterableReason);
                    } else if (exactRecords.length !== 0) {
                        value.link(entityManager, exactRecords);
                    }
                }
            }
        });
    }

    unlink(
        entityManager: EntityManager, 
        target: Record | ReadonlyArray<Record>,
        leastStringentArgs: VariableArgs | undefined,
        insideModification: boolean = false
    ) {
        this.refreshedVersion = entityManager.modificationVersion;
        this.changeLinks(() => {
            for (const value of this.valueMap.cloneValues()) {
                if (insideModification && leastStringentArgs?.key === value.args?.key) {
                    return;
                }
                const possibleRecords = 
                    (Array.isArray(target) ? target : [target])
                    .filter(target => value.contains(target));
                if (possibleRecords.length === 0) {
                    return;
                }
                const [isLinkOptimizable, unoptimizableReason] = value.isLinkOptimizable;
                if (!isLinkOptimizable) {
                    this.evict(entityManager, value.args, false, unoptimizableReason);
                } else if (VariableArgs.contains(value.args?.filterArgs, leastStringentArgs?.filterArgs)) {
                    value.unlink(
                        entityManager, 
                        possibleRecords
                    );
                } else {
                    const contains = this.field.associationProperties!.contains;
                    const exactRecords: Record[] = [];
                    let evict = false;
                    for (const possibleRecord of possibleRecords) {
                        const result = contains(possibleRecord.toRow(), value.args?.filterVariables);
                        if (result === undefined) {
                            evict = true;
                            break;
                        }
                        if (result === false) {
                            exactRecords.push(possibleRecord);
                        }
                    }
                    if (evict) {
                        this.evict(entityManager, value.args, false, this.unfilterableReason);
                    } else if (exactRecords.length !== 0) {
                        value.unlink(entityManager, exactRecords);
                    }
                }
            }
        });
    }

    unlinkAll(
        entityManager: EntityManager, 
        target: Record
    ) {
        this.refreshedVersion = entityManager.modificationVersion;
        this.changeLinks(() => {
            for (const value of this.valueMap.cloneValues()) {
                value.unlink(
                    entityManager, 
                    [target]
                );
            }
        });
    }

    appendTo(map: Map<string, any>) {
        this.valueMap.forEachValue(value => {
            map.set(
                VariableArgs.fieldKey(this.field.name, value.args), 
                value.getAsObject()
            );
        });
    }

    private value(args: VariableArgs | undefined): AssociationValue {
        return this.valueMap.computeIfAbsent(args?.key, () => {
            switch (this.field.category) {
                case "CONNECTION":
                    return new AssociationConnectionValue(this, args);
                case "LIST":
                    return new AssociationListValue(this, args);
                default:
                    return new AssociationReferenceValue(this, args);
            }
        });
    }

    private changeLinks(action: () => void) {
        if (this.linkChanging) {
            return;
        }
        this.linkChanging = true;
        try {
            action();
        } finally {
            this.linkChanging = false;
        }
    }

    refresh(entityManager: EntityManager, event: EntityEvictEvent | EntityChangeEvent) {
        if (this.refreshedVersion !== entityManager.modificationVersion) {
            this.refreshedVersion = entityManager.modificationVersion;
            for (const value of this.valueMap.cloneValues()) {
                value.referesh(entityManager, event); 
            }
        }
    }

    get unfilterableReason(): EvictReasonType | undefined {
        if (isEvictLogEnabled()) {
            if (this.field.isContainingConfigured) {
                return "contains-returns-undefined";
            } 
            return "no-contains";
        }
        return undefined;
    }

    writeTo(writer: TextWriter) {
        this.valueMap.forEachValue(value => {
            writer.seperator();
            writer.text('"');
            writer.text(value.association.field.name);
            if (value.args !== undefined) {
                writer.text(":");
                writer.text(JSON.stringify(value.args));
            }
            writer.text('": ');
            writer.text(JSON.stringify(value.getAsObject()));
        });
    }

    gcVisit(args: VariableArgs | undefined) {
        const value = this.valueMap.get(args?.key);
        if (value !== undefined) {
            value.gcVisited = true;
        }
    }

    collectGarbages(output: Garbage[]) {
        this.valueMap.forEachValue(value => {
            if (value.gcVisited) {
                value.gcVisited = false;
            } else {
                output.push({record: this.record, field: this.field, args: value.args });
            }
        })
    }

    monitor(): GraphField {
        let value: any = undefined;
        let parameterizedValues: ParameterizedValue[] | undefined;
        if (this.field.isParameterized) {
            const arr: ParameterizedValue[] = [];
            this.valueMap.forEach((k, v) => {
                arr.push({
                    parameter: k ?? "",
                    value: this.convertMonitorValue(v.get())
                });
            });
            arr.sort((a, b) => compare(a, b, "parameter"));
            parameterizedValues = arr;
        } else {
            value = this.convertMonitorValue(
                this.valueMap.get(undefined)?.get()
            );
        }
        const field: GraphField = {
            name: this.field.name,
            value,
            parameterizedValues
        };
        return field;
    }

    private convertMonitorValue(value: any): GraphValue | undefined {
        if (value === undefined) {
            return undefined;
        }
        if (this.field.category === "LIST") {
            return value.map((element: any) => (element as Record).id);
        }
        if (this.field.category === "CONNECTION") {
            const conn = value as RecordConnection;
            return {
                ...conn,
                edges: conn.edges.map(edge => {
                    return { ...edge, node: edge.node.id }
                })
            };
        }
        return (value as Record).id;
    }
}
