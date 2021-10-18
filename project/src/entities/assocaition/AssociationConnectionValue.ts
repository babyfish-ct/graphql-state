import { FieldMetadata } from "../../meta/impl/FieldMetadata";
import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
import { Association } from "./Association";

export class AssociationConnectionValue extends AssociationValue {

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
        target: Record | ReadonlyArray<Record>
    ): void {
        // TODO: link
    }

    unlink(
        entityManager: EntityManager, 
        self: Record, 
        association: Association, 
        target: Record | ReadonlyArray<Record>
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
