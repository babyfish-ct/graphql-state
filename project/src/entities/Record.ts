import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { SpaceSavingMap } from "../state/impl/SpaceSavingMap";
import { standardizedVariables } from "../state/impl/Variables";
import { BackReferences } from "./BackReferences";
import { EntityManager } from "./EntityManager";
import { ModificationContext } from "./ModificationContext";
import { RecordManager } from "./RecordManager";

export class Record {

    private scalarMap = new Map<string, any>();
    
    private associationMap = new SpaceSavingMap<FieldMetadata, Association>();

    readonly backReferences = new BackReferences();

    constructor(readonly id: any) {}

    set(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        fieldName: string, 
        field: FieldMetadata | undefined,
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
                variables,
                value
            );
        } else {
            if (variables !== undefined) {
                throw new Error('scalar fields does not support variables');
            }
            this.scalarMap.set(fieldName, value);
        }
    }
}

class Association {

    private valueMap = new SpaceSavingMap<string | undefined, AssociationValue>();

    constructor(readonly field: FieldMetadata) {
        if (field.category === "ID") {
            throw new Error("Internal bug: assocaition base on id field");
        }
    }

    set(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        record: Record, 
        associationField: FieldMetadata, 
        variables: any, 
        value: any
    ) {
        this.value(variables).set(ctx, entityManager, record, associationField, value);
    }

    private value(variables: any): AssociationValue {
        const vs = standardizedVariables(variables);
        const vsCode = vs !== undefined ? JSON.stringify(vs) : undefined;
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

    abstract set(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        record: Record, 
        associationField: FieldMetadata, 
        value: any
    ): void;
}

class AssociationReferenceValue extends AssociationValue {

    private referfence?: Record;

    set(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        record: Record, 
        associationField: FieldMetadata, 
        value: any
    ) {
        if (value === undefined && !associationField.isUndefinable) {
            throw Error(`Cannot set the undefined or null value to ${associationField.fullName} because it's not undefinable`);
        }
        const oldReference = this.referfence;
        const reference = value !== undefined ? 
            entityManager.saveId(ctx, associationField.targetType!.name, value.id) : 
            undefined;
        if (oldReference !== reference) {
            oldReference?.backReferences?.remove(associationField, record);
            this.referfence = reference;
            reference?.backReferences?.add(associationField, record);
        }
    }
}

class AssociationListValue extends AssociationValue {

    private elements?: Array<Record | undefined>;

    set(
        ctx: ModificationContext, 
        entityManager: EntityManager, 
        record: Record, 
        associationField: FieldMetadata, 
        value: any
    ) {
        
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
                element.backReferences.remove(associationField, record);
            }
        }
        this.elements = newElements.length === 0 ? undefined : newElements;
        for (const newElement of newElements) {
            if (newElement !== undefined) {
                if (!oldMap.has(newElement.id)) {
                    newElement.backReferences.add(associationField, record);
                }
            }
        }
    }
}

class AssociationConnectionValue extends AssociationValue {

    private connection: RecordConnection;

    set(
        ctx: ModificationContext, 
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
            const newNode = entityManager.saveId(ctx, associationField.targetType!.name, edge.node.id);
            newEdges.push({
                node: newNode, 
                cursor: edge.cursor
            });
        }
        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                element.backReferences.remove(associationField, record);
            }
        }
        this.connection = {
            ...value,
            edges: newEdges
        };
        for (const newEdge of newEdges) {
            if (!oldMap.has(newEdge.node.id)) {
                newEdge.node.backReferences.add(associationField, record);
            }
        }
    }
}

interface RecordConnection {

    readonly edges:  ReadonlyArray<RecordEdge>;

    readonly [key: string]: any;
}

interface RecordEdge {
    readonly node: Record;
        readonly cursor: string;
}
