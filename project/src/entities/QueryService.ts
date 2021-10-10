import { Fetcher } from "graphql-ts-client-api";
import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { EntityManager } from "./EntityManager";
import { ModificationContext } from "./ModificationContext";
import { Record, RecordConnection } from "./Record";
import { RuntimeShape, toRuntimeShape } from "./RuntimeShape";

export class QueryService {

    constructor(private entityMangager: EntityManager) {}

    query(shape: RuntimeShape): Promise<any> {
        throw new Error("Unsupported");
    }

    queryObject(
        id: any,
        shape: RuntimeShape
    ): Promise<any> {

        if (shape.typeName === "Query") {
            throw new Error(`The type "${shape.typeName}" does not support 'queryObject'`);
        }
        
        try {
            return Promise.resolve(this.findObject(id, shape));
        } catch (ex) {
            if (!ex[" $canNotFoundFromCache"]) {
                throw ex;
            }
        }

        return this.entityMangager.batchEntityRequest.requestByShape(id, shape).then(obj => {
            const ctx = new ModificationContext();
            this.entityMangager.save(ctx, shape, obj);
            ctx.fireEvents(e => {
                this.entityMangager.stateManager.publishEntityChangeEvent(e);
            });
            return obj;
        });
    }

    private findObject(
        id: any, 
        shape: RuntimeShape
    ): any {
        const ref = this.entityMangager.findRefById(shape.typeName, id);
        if (ref === undefined) {
            canNotFoundFromCache();
        }
        if (ref.value === undefined) {
            return undefined;
        }
        return mapRecord(
            this.entityMangager.schema.typeMap.get(shape.typeName)!,
            ref.value,
            shape
        );
    }
}

function mapRecord(
    type: TypeMetadata,
    record: Record, 
    runtimeSchape: RuntimeShape
): any {
    const idFieldName = type.idField.name;
    const entity = { [idFieldName]: record?.id };
    for (const field of runtimeSchape.fields) {
        if (field.childShape !== undefined) {
            const fieldMetadata = type.fieldMap.get(field.name)!
            const association = record.getAssociation(fieldMetadata, field.variables);
            if (association === undefined && !record.hasAssociation(fieldMetadata, field.variables)) {
                canNotFoundFromCache();
            }
            entity[field.alias ?? field.name] = mapAssociation(fieldMetadata, association, field.childShape);
        } else if (field.name !== idFieldName) {
            const scalar = record.getSalar(field.name);
            if (scalar === undefined && !record.hasScalar(field.name)) {
                canNotFoundFromCache();
            }
            entity[field.alias ?? field.name] = scalar;
        }
    }
    return entity;
}

function mapAssociation(
    field: FieldMetadata,
    association: Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined,
    shape: RuntimeShape
): any {
    
    if (association === undefined) {
        return undefined;
    }

    const targetType = field.targetType!;

    if (field.category === "CONNECTION") {
        const connection = association as RecordConnection;
        return {
            ...connection,
            edges: connection.edges.map(edge => {
                return {
                    ...edge,
                    node: mapRecord(targetType, edge.node, shape)
                };
            })
        };
    }
    if (field.category === "LIST") {
        const list = association as ReadonlyArray<Record | undefined>;
        return list.map(element => {
            if (element === undefined) {
                return undefined;
            }
            return mapRecord(targetType, element, shape);
        });
    }
    return mapRecord(targetType, association as Record, shape);
}

function canNotFoundFromCache(): never {
    throw { " $canNotFoundFromCache": true };
}