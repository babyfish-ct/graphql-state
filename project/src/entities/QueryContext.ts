import { Fetcher } from "graphql-ts-client-api";
import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { BatchEntityRequest } from "./BatchEntityRequest";
import { EntityManager } from "./EntityManager";
import { Record, RecordConnection } from "./Record";
import { RuntimeShape, toRuntimeShape } from "./RuntimeShape";

export class QueryContext {

    constructor(private entityMangager: EntityManager) {}

    queryObject(
        fetcher: Fetcher<string, object, object>,
        id: any,
        variables?: object
    ): Promise<any> {

        const type = this.entityMangager.schema.typeMap.get(fetcher.fetchableType.name);
        if (type === undefined) {
            throw Error(`Illegal type name ${fetcher.fetchableType.name}`);
        }
        const runtimeShape = toRuntimeShape(fetcher, variables);
        try {
            return Promise.resolve(this.findObject(id, runtimeShape));
        } catch (ex) {
            if (!ex[" $canNotFoundFromCache"]) {
                throw ex;
            }
        }

        return this.entityMangager.batchEntityRequest.requestByShape(id, runtimeShape);
    }

    private findObject(
        id: any, 
        shape: RuntimeShape
    ): any {
        const ref = this.entityMangager.findById(shape.typeName, id);
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