import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { SpaceSavingMap } from "../state/impl/SpaceSavingMap";
import { BackReferences } from "./BackReferences";
import { EntityManager } from "./EntityManager";
import { VariableArgs } from "./VariableArgs";

export class Record {

    private scalarMap = new Map<string, any>();
    
    private associationMap = new SpaceSavingMap<FieldMetadata, Association>();

    readonly backReferences = new BackReferences();

    constructor(readonly type: TypeMetadata, readonly id: any, private deleted: boolean = false) {
        if (type.name === 'Query') {
            if (id !== QUERY_OBJECT_ID) {
                throw new Error(`The id of query object must be '${QUERY_OBJECT_ID}'`);
            }
            if (deleted) {
                throw new Error(`The object of special type 'Query' cannot be deleted`);
            }
        }
    }

    get isDeleted(): boolean {
        return this.deleted;
    }

    hasScalar(fieldName: string): boolean {
        return this.scalarMap.has(fieldName);
    }

    getSalar(fieldName: string): any {
        return this.scalarMap.get(fieldName);
    }

    hasAssociation(field: FieldMetadata, args?: VariableArgs): boolean {
        return this.associationMap.get(field)?.has(args) === true;
    }

    getAssociation(field: FieldMetadata, args?: VariableArgs): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined {
        return this.associationMap.get(field)?.get(args);
    }

    set(
        entityManager: EntityManager, 
        field: FieldMetadata,
        args: VariableArgs | undefined,
        value: any
    ) {
        if (field?.isAssociation) {
            this
            .associationMap
            .computeIfAbsent(field, f => new Association(f))
            .set(
                entityManager,
                this,
                args,
                value
            );
        } else {
            if (args?.variables !== undefined) {
                throw new Error('scalar fields does not support variables');
            }
            if (field === this.type.idField) {
                if (value !== this.id) {
                    throw new Error(`Cannot chanage "${this.type.idField.fullName} because its id field"`);
                }
            } else {
                const oldValue = this.scalarMap.get(field.name);
                if (oldValue !== value) {
                    this.scalarMap.set(field.name, value);
                    entityManager.modificationContext.set(this, field.name, args?.key, oldValue, value);
                }
            }
        }
    }

    link(
        entityManager: EntityManager,
        associationField: FieldMetadata,
        record: Record
    ) {
        this.associationMap.get(associationField)?.link(
            entityManager,
            this,
            record,
            undefined,
            true
        );
    }

    unlink(
        entityManager: EntityManager,
        associationField: FieldMetadata,
        record: Record
    ) {
        this.associationMap.get(associationField)?.unlink(
            entityManager,
            this,
            record,
            undefined,
            true
        );
    }

    delete(entityManager: EntityManager) {
        if (this.deleted) {
            return;
        }
        if (this.type.name === 'Query') {
            throw new Error(`The object of special type 'Query' cannot be deleted`);
        }
        this.scalarMap.clear();
        this.associationMap.clear();
        this.backReferences.forEach((field, _, record) => {
            record.associationMap.get(field)?.forceUnlink(
                entityManager,
                record,
                this
            );
        });
        this.deleted = true;
    }

    undelete() {
        this.deleted = false;
    }
}

class Association {

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
        target: Record,
        mostStringentArgs: VariableArgs | undefined,
        changedByOpposite: boolean
    ) {
        if (!this.frozen || !changedByOpposite) {
            entityManager.modificationContext.update(self);
            this.valueMap.forEachValue(value => {
                if (mostStringentArgs?.key === value.args?.key && !changedByOpposite) {
                    return;
                }
                value.link(
                    entityManager, 
                    self, 
                    this, 
                    target,
                    VariableArgs.contains(mostStringentArgs, value.args)
                );
            });
        }
    }

    unlink(
        entityManager: EntityManager, 
        self: Record, 
        target: Record,
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
                        target,
                        true
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
                target,
                true
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

abstract class AssociationValue {

    constructor(readonly args?: VariableArgs) {}

    abstract get(): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined;

    abstract set(
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        value: any
    ): void;

    abstract link(
        entityManager: EntityManager, 
        self: Record, 
        association: Association, 
        target: Record | ReadonlyArray<Record>,
        absolute: boolean
    ): void;

    abstract unlink(
        entityManager: EntityManager, 
        self: Record, 
        association: Association, 
        target: Record | ReadonlyArray<Record>,
        absolute: boolean
    ): void;

    protected releaseOldReference(
        entityManager: EntityManager,
        self: Record,
        associationField: FieldMetadata, 
        oldRefernce: Record | undefined
    ) {
        if (oldRefernce !== undefined) {
            oldRefernce.backReferences.remove(
                associationField, 
                this.args,
                self
            );
            const oppositeField = associationField.oppositeField;
            if (oppositeField !== undefined) {
                if (oldRefernce) {
                    oldRefernce.unlink(entityManager, oppositeField, self);
                }
            }
        }
    }

    protected retainNewReference(
        entityManager: EntityManager,
        self: Record,
        associationField: FieldMetadata, 
        newReference: Record | undefined
    ) {
        if (newReference !== undefined) {
            newReference.backReferences.add(
                associationField, 
                this.args,
                self
            );
            const oppositeField = associationField.oppositeField;
            if (oppositeField !== undefined) {
                newReference.link(entityManager, oppositeField, self);
            }
        }
    }
}

class AssociationReferenceValue extends AssociationValue {

    private referfence?: Record;

    get(): Record | undefined {
        return this.referfence;
    }

    set(
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        value: any
    ) {
        const reference = 
            value !== undefined && value !== null ? 
            entityManager.saveId(associationField.targetType!.name, value[associationField.targetType!.idField.name]) : 
            undefined;

        const oldReference = this.referfence;
        if (oldReference?.id !== reference?.id) {
            this.releaseOldReference(entityManager, self, associationField, oldReference);
            this.referfence = reference;
            this.retainNewReference(entityManager, self, associationField, reference);
            entityManager.modificationContext.set(
                self, 
                associationField.name, 
                this.args?.key,
                objectWithOnlyId(oldReference),
                objectWithOnlyId(reference),
            );
        }
    }

    link(
        entityManager: EntityManager, 
        self: Record, 
        association: Association, 
        target: Record | ReadonlyArray<Record>,
        absolute: boolean
    ) {
        let targetRecord: Record;
        if (Array.isArray(target)) {
            if (target.length === 0) {
                return;
            }
            if (target.length > 1) {
                throw new Error(`Internal bug: Cannot link AbstractReerenceValue with array whose length is greater than 1`);
            }
            targetRecord = target.length === 1 ? target[0] : undefined;
        } else {
            targetRecord = target as Record;
        }
        if (this.referfence?.id !== targetRecord?.id) {
            association.set(
                entityManager,
                self,
                this.args,
                objectWithOnlyId(targetRecord)
            );
        }
    }

    unlink(
        entityManager: EntityManager, 
        self: Record, 
        association: Association,
        target: Record | ReadonlyArray<Record>,
        absolute: boolean
    ) {
        let targetRecord: Record;
        if (Array.isArray(target)) {
            if (target.length === 0) {
                return;
            }
            if (target.length > 1) {
                throw new Error(`Internal bug: Cannot unlink AbstractReerenceValue with array whose length is greater than 1`);
            }
            targetRecord = target.length === 1 ? target[0] : undefined;
        } else {
            targetRecord = target as Record;
        }
        if (this.referfence?.id === targetRecord.id) {
            association.set(
                entityManager,
                self,
                this.args,
                undefined
            )
        }
    }
}

class AssociationListValue extends AssociationValue {

    private elements?: Array<Record | undefined>;

    get(): ReadonlyArray<Record | undefined> {
        return this.elements ?? [];
    }

    set(
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        value: any
    ) {
        
        let listChanged = (this.elements?.length ?? 0) !== (value?.length ?? 0);
        if (!listChanged) {
            const idFieldName = associationField.targetType!.idField.name;
            for (let i = (value?.length ?? 0) - 1; i >= 0; --i) {
                const oldId = this.elements !== undefined && this.elements[i] !== undefined ? 
                    this.elements[i]?.id :
                    undefined
                ;
                const newId = value[i] !== undefined && value[i] !== null ?
                    value[i][idFieldName] :
                    undefined
                ;
                if (oldId !== newId) {
                    listChanged = true;
                    break;
                }
            }
        }
        const oldValueForTriggger = listChanged ? this.elements?.map(objectWithOnlyId) : undefined;

        const oldMap = toRecordMap(this.elements);

        const newIds = new Set<any>();
        const newElements: Array<Record | undefined> = [];
        if (Array.isArray(value)) {
            const idFieldName = associationField.targetType!.idField.name;
            for (const item of value) {
                if (item !== undefined && item !== null) {
                    const newElement = entityManager.saveId(associationField.targetType!.name, item[idFieldName]);
                    newIds.add(newElement.id);
                    newElements.push(newElement);
                } else {
                    newElements.push(undefined);
                }
            }
        }

        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, self, associationField, element);
            }
        }

        this.elements = newElements.length === 0 ? undefined : newElements;

        for (const newElement of newElements) {
            if (newElement !== undefined) {
                if (!oldMap.has(newElement.id)) {
                    this.retainNewReference(entityManager, self, associationField, newElement);
                }
            }
        }

        if (listChanged) {
            entityManager.modificationContext.set(
                self, 
                associationField.name, 
                this.args?.key, 
                oldValueForTriggger, 
                this.elements?.map(objectWithOnlyId)
            );
        }
    }

    link(
        entityManager: EntityManager, 
        self: Record, 
        association: Association,
        target: Record | ReadonlyArray<Record>,
        absolute: boolean
    ) {
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = toRecordMap(elements);
        const linkMap = toRecordMap(Array.isArray(target) ? target : [target]);
        for (const record of linkMap.values()) {
            if (!elementMap.has(record.id)) {
                elements.push(record);
            }
        }
        if (elements.length !== this.elements?.length ?? 0) {
            association.set(
                entityManager,
                self,
                this.args,
                elements.map(objectWithOnlyId)
            );
        }
    }

    unlink(
        entityManager: EntityManager, 
        self: Record, 
        association: Association,
        target: Record | ReadonlyArray<Record>,
        absolute: boolean
    ) {
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = toRecordMap(elements);
        const unlinkMap = toRecordMap(Array.isArray(target) ? target : [target]);
        for (const record of unlinkMap.values()) {
            if (elementMap.has(record.id)) {
                const index = elements.findIndex(element => element?.id === record.id);
                elements.splice(index, 1);
            }
        }
        if (elements.length !== this.elements?.length ?? 0) {
            association.set(
                entityManager,
                self,
                this.args,
                elements.map(objectWithOnlyId)
            );
        }
    }
}

class AssociationConnectionValue extends AssociationValue {

    private connection: RecordConnection;

    get(): RecordConnection {
        return this.connection;
    }

    set(
        entityManager: EntityManager, 
        record: Record, 
        associationField: FieldMetadata, 
        value: any
    ) {
        if (value === undefined) {
            throw Error(`Cannot set the undefined or null value to ${associationField.fullName} because it's connection field`);
        }
        if (!Array.isArray(typeof value.edges)) {
            throw Error(`The connection object of ${associationField.fullName} must have an array field named "edges"`);
        }

        const oldMap = new Map<any, Record>();
        this.connection?.edges?.forEach(edge => {
            oldMap.set(edge.node.id, edge.node);
        });

        const newIds = new Set<any>();
        const newEdges: Array<RecordEdge> = [];
        for (const edge of value.edges) {
            if (typeof edge.node !== "object") {
                throw Error(`Each edge of the connection object of ${associationField.fullName} must have an object field named "node"`);
            }
            if (typeof edge.cursor !== "string") {
                throw Error(`Each edge of the connection object of ${associationField.fullName} must have an string field named "cursor"`);
            }
            const newNode = entityManager.saveId(associationField.targetType!.name, edge.node.id);
            newEdges.push({
                node: newNode, 
                cursor: edge.cursor
            });
        }

        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, record, associationField, element);
            }
        }
        
        this.connection = {
            ...value,
            edges: newEdges
        };
        
        for (const newEdge of newEdges) {
            if (!oldMap.has(newEdge.node.id)) {
                this.retainNewReference(entityManager, record, associationField, newEdge.node);
            }
        }

        // TODO: Trigger
    }

    link(
        entityManager: EntityManager, 
        self: Record, 
        association: Association, 
        target: Record | ReadonlyArray<Record>,
        absolute: boolean
    ): void {
        // TODO: link
    }

    unlink(
        entityManager: EntityManager, 
        self: Record, 
        association: Association, 
        target: Record | ReadonlyArray<Record>,
        absolute: boolean
    ) {
        // TODO: link
    }
}

export interface RecordConnection {

    readonly edges:  ReadonlyArray<RecordEdge>;

    readonly [key: string]: any;
}

export interface RecordEdge {
    readonly node: Record;
        readonly cursor: string;
}

export const QUERY_OBJECT_ID = "unique-id-of-qury-object";

function toRecordMap(arr: ReadonlyArray<Record | undefined> | undefined): Map<any, Record> {
    const map = new Map<any, Record>();
    if (arr !== undefined) {
        for (const element of arr) {
            if (element !== undefined) {
                map.set(element.id, element);
            }
        }
    }
    return map;
}

function objectWithOnlyId(record: Record | undefined): any {
    if (record === undefined) {
        return undefined;
    }
    return { [record.type.idField.name]: record.id };
}
