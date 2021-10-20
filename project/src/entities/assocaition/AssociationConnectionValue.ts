import { EntityManager } from "../EntityManager";
import { objectWithOnlyId, Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";

export class AssociationConnectionValue extends AssociationValue {

    private connection: RecordConnection;

    getAsObject(): ObjectConnection {
        return {
            ...this.connection,
            edges: this.connection.edges.map(edge => {
                return {
                    ...edge,
                    node: objectWithOnlyId(edge.node)
                };
            })
        };
    }

    get(): RecordConnection {
        return this.connection;
    }

    set(
        entityManager: EntityManager, 
        value: any
    ) {
        const association = this.association;
        if (value === undefined) {
            throw Error(`Cannot set the undefined or null value to ${association.field.fullName} because it's connection field`);
        }
        if (!Array.isArray(typeof value.edges)) {
            throw Error(`The connection object of ${association.field.fullName} must have an array field named "edges"`);
        }

        const oldMap = new Map<any, Record>();
        this.connection?.edges?.forEach(edge => {
            oldMap.set(edge.node.id, edge.node);
        });

        const newIds = new Set<any>();
        const newEdges: Array<RecordEdge> = [];
        for (const edge of value.edges) {
            if (typeof edge.node !== "object") {
                throw Error(`Each edge of the connection object of ${association.field.fullName} must have an object field named "node"`);
            }
            if (typeof edge.cursor !== "string") {
                throw Error(`Each edge of the connection object of ${association.field.fullName} must have an string field named "cursor"`);
            }
            const newNode = entityManager.saveId(association.field.targetType!.name, edge.node.id);
            newEdges.push({
                node: newNode, 
                cursor: edge.cursor
            });
        }

        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, element);
            }
        }
        
        this.connection = {
            ...value,
            edges: newEdges
        };
        
        for (const newEdge of newEdges) {
            if (!oldMap.has(newEdge.node.id)) {
                this.retainNewReference(entityManager, newEdge.node);
            }
        }

        // TODO: Trigger
    }

    link(
        entityManager: EntityManager, 
        target: Record | ReadonlyArray<Record>
    ): void {
        // TODO: link
    }

    unlink(
        entityManager: EntityManager, 
        target: Record | ReadonlyArray<Record>
    ) {
        // TODO: link
    }

    contains(target: Record): boolean {
        // TODO: contains
        throw new Error();
    }
}

export interface RecordConnection {
    readonly edges: ReadonlyArray<RecordEdge>;
    readonly [key: string]: any;
}

export interface RecordEdge {
    readonly node: Record;
    readonly cursor: string;
}

export interface ObjectConnection {

    readonly edges: ReadonlyArray<ObjectEdge>;
    readonly [key: string]: any;
}

export interface ObjectEdge {
    readonly node: Record;
    readonly cursor: string;
}
