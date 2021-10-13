import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { SpaceSavingMap } from "../state/impl/SpaceSavingMap";
import { standardizedVariables } from "../state/impl/Variables";
import { BackReferences } from "./BackReferences";
import { EntityManager } from "./EntityManager";
import { ModificationContext } from "./ModificationContext";

export class Record {

    private scalarMap = new Map<string, any>();
    
    private associationMap = new SpaceSavingMap<FieldMetadata, Association>();

    readonly backReferences = new BackReferences();

    constructor(readonly type: TypeMetadata, readonly id: any, private deleted: boolean = false) {}

    hasScalar(fieldName: string): boolean {
        return this.scalarMap.has(fieldName);
    }

    getSalar(fieldName: string): any {
        return this.scalarMap.get(fieldName);
    }

    hasAssociation(field: FieldMetadata, variables: any): boolean {
        return this.associationMap.get(field)?.has(variables) === true;
    }

    getAssociation(field: FieldMetadata, variables: any): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined {
        return this.associationMap.get(field)?.get(variables);
    }

    set(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        field: FieldMetadata,
        variablesCode: string | undefined,
        variables: any, 
        value: any
    ) {
        if (field?.isAssociation) {
            this
            .associationMap
            .computeIfAbsent(field, f => new Association(f))
            .set(
                ctx,
                entityManager,
                this,
                field,
                variablesCode,
                variables,
                value
            );
        } else {
            if (variables !== undefined) {
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
                    ctx.set(this, field.name, variablesCode, oldValue, value);
                }
            }
        }
    }

    get isDeleted(): boolean {
        return this.deleted;
    }

    delete(ctx: ModificationContext, entityManager: EntityManager) {
        if (this.deleted) {
            return;
        }
        this.scalarMap.clear();
        this.associationMap.clear();
        this.backReferences.forEach((field, _, record) => {
            record.unlink(ctx, entityManager, field, this);
        });
        this.deleted = true;
    }

    undelete() {
        this.deleted = false;
    }

    link(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        associationField: FieldMetadata,
        target: Record
    ) {
        this.associationMap.forEachValue(association => {
            if (association.field === associationField) {
                ctx.update(this);
                association.link(ctx, entityManager, this, target);
            }
        });
    }

    unlink(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        associationField: FieldMetadata,
        target: Record
    ) {
        this.associationMap.forEachValue(association => {
            if (association.field === associationField) {
                ctx.update(this);
                association.unlink(ctx, entityManager, this, target);
            }
        });
    }
}

class Association {

    private valueMap = new SpaceSavingMap<string | undefined, AssociationValue>();

    constructor(readonly field: FieldMetadata) {
        if (field.category === "ID") {
            throw new Error("Internal bug: assocaition base on id field");
        }
    }

    has(variables: any): boolean {
        return this.valueOrUndefined(variables) !== undefined;
    }

    get(variables: any): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined {
        return this.valueOrUndefined(variables)?.get();
    }

    set(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        record: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        variables: any, 
        value: any
    ) {
        this.value(variables).set(ctx, entityManager, record, associationField, variablesCode, variables, value);
    }

    link(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record,
        target: Record
    ) {
        this.valueMap.forEach((vsCode, value) => {
            value.link(ctx, entityManager, self, this.field, vsCode, target);
        });
    }

    unlink(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record,
        target: Record
    ) {
        this.valueMap.forEach((vsCode, value) => {
            value.unlink(ctx, entityManager, self, this.field, vsCode, target);
        });
    }

    private valueOrUndefined(variables: any): AssociationValue | undefined {
        const vs = standardizedVariables(variables);
        const vsCode = vs !== undefined ? JSON.stringify(vs) : undefined;
        return this.valueMap.get(vsCode);
    }

    private value(variables: any): AssociationValue {
        const vs = standardizedVariables(variables);
        const vsCode = JSON.stringify(vs);
        return this.valueMap.computeIfAbsent(vsCode, () => {
            switch (this.field.category) {
                case "CONNECTION":
                    return new AssociationConnectionValue();
                case "LIST":
                    return new AssociationListValue();
                default:
                    return new AssociationReferenceValue();
            }
        });
    }
}

abstract class AssociationValue {

    private linkFrozen = false;

    abstract get(): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined;

    abstract set(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        record: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        variables: any, 
        value: any
    ): void;

    link(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        target: Record
    ): void {
        if (!this.linkFrozen) {
            this.linkFrozen = true;
            try {
                this.onLink(ctx, entityManager, self, associationField, variablesCode, target);
            } finally {
                this.linkFrozen = false;
            }
        }
    }

    unlink(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        target: Record
    ) {
        if (!this.linkFrozen) {
            this.linkFrozen = true;
            try {
                this.onUnlink(ctx, entityManager, self, associationField, variablesCode, target);
            } finally {
                this.linkFrozen = false;
            }
        }
    }

    protected abstract onLink(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        target: Record
    ): void;

    protected abstract onUnlink(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        target: Record
    ): void;

    protected releaseOldReference(
        ctx: ModificationContext,
        entityManager: EntityManager,
        self: Record,
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        oldRefernce: Record | undefined
    ) {
        if (oldRefernce !== undefined) {
            oldRefernce.backReferences.remove(
                associationField, 
                variablesCode,
                self
            );
            const oppositeField = associationField.oppositeField;
            if (oppositeField !== undefined) {
                if (oldRefernce)
                oldRefernce.unlink(ctx, entityManager, oppositeField, self);
            }
        }
    }

    protected retainNewReference(
        ctx: ModificationContext,
        entityManager: EntityManager,
        self: Record,
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        variables: any | undefined,
        newReference: Record | undefined
    ) {
        if (newReference !== undefined) {
            newReference.backReferences.add(
                associationField, 
                variablesCode, 
                variables, 
                self
            );
            const oppositeField = associationField.oppositeField;
            if (oppositeField !== undefined) {
                newReference.link(ctx, entityManager, oppositeField, self);
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
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        variables: any, 
        value: any
    ) {
        const reference = 
            value !== undefined ? 
            entityManager.saveId(ctx, associationField.targetType!.name, value.id) : 
            undefined;

        const oldReference = this.referfence;
        if (oldReference !== reference) {
            this.releaseOldReference(ctx, entityManager, self, associationField, variablesCode, oldReference);
            this.referfence = reference;
            this.retainNewReference(ctx, entityManager, self, associationField, variablesCode, variables, reference);
            ctx.set(
                self, 
                associationField.name, 
                variablesCode,
                objectWithOnlyId(oldReference),
                objectWithOnlyId(reference),
            );
        }
    }

    protected onLink(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        target: Record
    ) {
        if (this.referfence?.id !== target.id) {
            const variables = variablesCode !== undefined ? JSON.parse(variablesCode) : undefined;
            this.set(
                ctx,
                entityManager,
                self,
                associationField,
                variablesCode,
                variables,
                { [associationField.targetType!.idField.name]: target.id }
            );
        }
    }

    protected onUnlink(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        target: Record
    ) {
        if (this.referfence?.id === target.id) {
            const variables = variablesCode !== undefined ? JSON.parse(variablesCode) : undefined;
            this.set(
                ctx,
                entityManager,
                self,
                associationField,
                variablesCode,
                variables,
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
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        variables: any, 
        value: any
    ) {
        
        let listChanged = (this.elements?.length ?? 0) !== (value?.length ?? 0);
        if (!listChanged) {
            const idFieldName = self.type.idField.name;
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

        const oldMap = new Map<any, Record>();
        this.elements?.forEach(element => {
            if (element !== undefined) {
                oldMap.set(element.id, element);
            }
        });

        const newIds = new Set<any>();
        const newElements: Array<Record | undefined> = [];
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item !== undefined && item !== null) {
                    const newElement = entityManager.saveId(ctx, associationField.targetType!.name, item.id);
                    newIds.add(newElement.id);
                    newElements.push(newElement);
                } else {
                    newElements.push(undefined);
                }
            }
        }

        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(ctx, entityManager, self, associationField, variablesCode, element);
            }
        }

        this.elements = newElements.length === 0 ? undefined : newElements;

        for (const newElement of newElements) {
            if (newElement !== undefined) {
                if (!oldMap.has(newElement.id)) {
                    this.retainNewReference(ctx, entityManager, self, associationField, variablesCode, variables, newElement);
                }
            }
        }

        if (listChanged) {
            ctx.set(
                self, 
                associationField.name, 
                variablesCode, 
                oldValueForTriggger, 
                this.elements?.map(objectWithOnlyId)
            );
        }
    }

    protected onLink(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        target: Record
    ) {
        
        if (this.elements !== undefined) {
            for (const element of this.elements) {
                if (element?.id === target.id) {
                    return;
                }
            }
        }

        const variables = variablesCode !== undefined ? JSON.parse(variablesCode) : undefined;
        const idFieldName = associationField.targetType!.idField.name;
        const list = this.elements?.map(element => {
            if (element === undefined) {
                return undefined;
            }
            return { [idFieldName]: element.id };
        }) ?? [];
        list.push({[idFieldName]: target.id});
        this.set(
            ctx,
            entityManager,
            self,
            associationField,
            variablesCode,
            variables,
            list
        );
    }

    protected onUnlink(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        target: Record
    ) {
        let index = -1;
        if (this.elements !== undefined) {
            for (let i = this.elements.length - 1; i >= 0; --i) {
                if (this.elements[i]?.id === target.id) {
                    index = i;
                    break;
                }
            }
        }
        if (index === -1) {
            return;
        }

        const variables = variablesCode !== undefined ? JSON.parse(variablesCode) : undefined;
        const idFieldName = associationField.targetType!.idField.name;
        const list = this.elements?.map(element => {
            if (element === undefined) {
                return undefined;
            }
            return { [idFieldName]: element.id };
        }) ?? [];
        list.splice(index, 1);
        this.set(
            ctx,
            entityManager,
            self,
            associationField,
            variablesCode,
            variables,
            list
        );
    }
}

class AssociationConnectionValue extends AssociationValue {

    private connection: RecordConnection;

    get(): RecordConnection {
        return this.connection;
    }

    set(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        record: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        variables: any, 
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
            const newNode = entityManager.saveId(ctx, associationField.targetType!.name, edge.node.id);
            newEdges.push({
                node: newNode, 
                cursor: edge.cursor
            });
        }

        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(ctx, entityManager, record, associationField, variablesCode, element);
            }
        }
        
        this.connection = {
            ...value,
            edges: newEdges
        };
        
        for (const newEdge of newEdges) {
            if (!oldMap.has(newEdge.node.id)) {
                this.retainNewReference(ctx, entityManager, record, associationField, variablesCode, variables, newEdge.node);
            }
        }

        // TODO: Trigger
    }

    protected onLink(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        target: Record
    ) {
        // TODO: link
    }

    protected onUnlink(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        variablesCode: string | undefined,
        target: Record
    ) {
        // TODO: unlink
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

function objectWithOnlyId(record: Record | undefined): any {
    if (record === undefined) {
        return undefined;
    }
    return { [record.type.idField.name]: record.id };
}
