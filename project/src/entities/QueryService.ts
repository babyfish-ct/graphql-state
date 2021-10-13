import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { EntityManager } from "./EntityManager";
import { QUERY_OBJECT_ID, Record, RecordConnection } from "./Record";
import { RuntimeShape } from "./RuntimeShape";

export class QueryService {

    constructor(private entityMangager: EntityManager) {}

    query(shape: RuntimeShape): RawQueryResult<any> {
        
        if (shape.typeName !== "Query") {
            throw new Error(`The type of 'shape' arugment of 'query' must be 'Query'`);
        }

        try {
            return {
                type: "cached",
                data: this.findObject(QUERY_OBJECT_ID, shape)
            }
        } catch (ex) {
            if (!ex[" $canNotFoundFromCache"]) {
                throw ex;
            }
        }

        return {
            type: "deferred",
            promise: this.loadMissedQuery(shape)
        };
    }

    queryObjects(
        ids: ReadonlyArray<any>,
        shape: RuntimeShape
    ): RawQueryResult<ReadonlyArray<any>> {

        if (shape.typeName === "Query") {
            throw new Error(`The type of 'shape' arugment of 'query' cannot be 'Query'`);
        }

        if (ids.length === 0) {
            return {
                type: "cached",
                data: []
            }
        }
        
        const map = this.findObjects(ids, shape);
        const missedIds: any[] = [];
        for (const id of ids) {
            if (!map.has(id)) {
                missedIds.push(id);
            }
        }
        if (missedIds.length === 0) {
            return {
                type: "cached",
                data: Array.from(map.values())
            }
        }

        return {
            type: "deferred",
            promise: this.loadMissedObjects(map, missedIds, shape)
        };
    }

    private findObjects(
        ids: ReadonlyArray<any>,
        shape: RuntimeShape
    ): Map<any, any> {
        const map = new Map<any, any>();
        for (const id of ids) {
            try {
                map.set(id, this.findObject(id, shape));
            } catch (ex) {
                if (!ex[" $canNotFoundFromCache"]) {
                    throw ex;
                }
                map.set(id, undefined);
            }
        }
        return map;
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

    private async loadMissedObjects(
        cachedMap: Map<any, any>,
        missedIds: ReadonlyArray<any>, 
        shape: RuntimeShape
    ): Promise<ReadonlyArray<any>> {

        const missedObjects = await this.entityMangager._batchEntityRequest.requestObjectByShape(missedIds, shape);
        const idFieldName = this.entityMangager.schema.typeMap.get(shape.typeName)!.idField.name;
        for (const missedObject of missedObjects) {
            cachedMap.set(missedObject[idFieldName], missedObject);
        }

        this.entityMangager.modify(() => {
            for (const missedId of missedIds) {
                const obj = cachedMap.get(missedId);
                if (obj !== undefined) {
                    this.entityMangager.save(shape, obj);
                } else {
                    this.entityMangager.delete(shape.typeName, missedId);
                }
            }
        });

        return Array.from(cachedMap.values());;
    }

    private async loadMissedQuery(
        shape: RuntimeShape
    ): Promise<any> {
        throw new Error(`Unsupported operation`);
    }
}

export type RawQueryResult<T> = CachedResult<T> | DeferredResult<T>;

interface CachedResult<T> {
    readonly type: "cached";
    readonly data: T;
}

interface DeferredResult<T> {
    readonly type: "deferred";
    readonly promise: Promise<T>;
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