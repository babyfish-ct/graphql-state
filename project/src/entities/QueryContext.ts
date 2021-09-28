import { GraphQLFetcher } from "../gql/GraphQLFetcher";
import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { EntityManager } from "./EntityManager";
import { Record, RecordConnection } from "./Record";

export class QueryContext {

    constructor(private entityMangager: EntityManager) {}

    queryObjectByShape(
        typeName: string, 
        id: any, 
        shape: any, 
        options?: {}
    ): Promise<any> {

        try {
            return Promise.resolve(this.findObjectByShape(typeName, id, shape));
        } catch (ex) {
            if (!ex[" $canNotFoundFromCache"]) {
                throw ex;
            }
        }

        throw new Error("No object in cache");
    }

    queryObjectByFetcher(
        id: any, 
        fetcher: GraphQLFetcher<string, any, any>, 
        options?: {
            readonly variables: any
        }
    ): Promise<any> {
        throw new Error();
    }

    queryByFetcher(
        fetcher: GraphQLFetcher<string, any, any>, 
        options?: {
            readonly variables: any
        }
    ): Promise<any> {
        throw new Error();
    }

    private findObjectByShape(
        typeName: string, 
        id: any, 
        shape: object
    ): any {
        const ref = this.entityMangager.findById(typeName, id);
        if (ref === undefined) {
            canNotFoundFromCache();
        }
        if (ref.value === undefined) {
            return undefined;
        }
        return mapRecordByShape(
            this.entityMangager.schema.typeMap.get(typeName)!,
            ref.value,
            shape
        );
    }
}

function mapRecordByShape(
    type: TypeMetadata, 
    record: Record, 
    shape: object
): any {
    const idFieldName = type.idField.name;
    const entity = { [idFieldName]: record?.id };
    for (const fieldName in shape) {
        const childShape = shape[fieldName];
        if (childShape) {
            const variables = childShape[" $variables"];
            const field = type.fieldMap.get(fieldName);
            if (field?.isAssociation) {
                const association = record.getAssociation(field, variables);
                if (association === undefined && !record.hasAssociation(field, variables)) {
                    canNotFoundFromCache();
                }
                entity[fieldName] = mapAssociationByShape(field, association, typeof childShape === "object" ? childShape : {});
            } else if (fieldName !== idFieldName) {
                if (variables !== undefined) {
                    throw new Error(`Can query ${type.name}.${fieldName}, cannot specifiy variables for scalar field`);
                }
                const scalar = record.getSalar(fieldName);
                if (scalar === undefined && !record.hasScalar(fieldName)) {
                    canNotFoundFromCache();
                }
                entity[fieldName] = scalar;
            }
        }
    }
    return entity;
}

function mapAssociationByShape(
    field: FieldMetadata,
    association: Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined,
    shape: object
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
                    node: mapRecordByShape(targetType, edge.node, shape)
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
            return mapRecordByShape(targetType, element, shape);
        });
    }
    return mapRecordByShape(targetType, association as Record, shape);
}

function canNotFoundFromCache(): never {
    throw { " $canNotFoundFromCache": true };
}