import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { RecordConnection } from "./assocaition/AssociationConnectionValue";;
import { EntityManager } from "./EntityManager";
import { QueryArgs } from "./QueryArgs";
import { QUERY_OBJECT_ID, Record } from "./Record";
import { RuntimeShape } from "./RuntimeShape";

export class QueryService {

    constructor(private entityManager: EntityManager) {}

    query(args: QueryArgs, useCache: boolean, useDataService: boolean): RawQueryResult<any> {
        if (args.ids === undefined) {
            return this.graph(args, useCache, useDataService);
        }
        return this.objects(args, useCache, useDataService) as any;
    }

    private graph(args: QueryArgs, useCache: boolean, useDataService: boolean): RawQueryResult<any> {
        if (useCache) {
            try {
                return {
                    type: "cached",
                    data: this.findObject(QUERY_OBJECT_ID, args.shape)
                }
            } catch (ex) {
                if (!ex[" $canNotFoundFromCache"]) {
                    throw ex;
                }
                const reason = ex["reason"];
                if (useDataService) {
                    console.debug(reason);
                } else {
                    throw new Error(reason);
                }
            }
        }

        if (useDataService) {
            return {
                type: "deferred",
                promise: this.entityManager.dataService.query(args.withoutPaginationInfo())
            };
        }

        throw new Error('Internal bug: neither "useCache" nor "useDataService" is set');
    }

    private objects(args: QueryArgs, useCache: boolean, useDataService: boolean): RawQueryResult<ReadonlyArray<any>> {
        const ids = args.ids!;
        if (ids.length === 0) {
            return {
                type: "cached",
                data: []
            }
        }
        
        let map = new Map<any, any>();
        if (useCache) {
            map = this.findObjects(ids, args.shape);
        } else {
            map = new Map<any, any>();
        }
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

        if (useDataService) {
            return {
                type: "deferred",
                promise: this.loadAndMerge(map, args, missedIds)
            };
        }

        throw new Error('Internal bug: neither "useCache" nor "useDataService" is set');
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
            }
        }
        return map;
    }

    private findObject(
        id: any, 
        shape: RuntimeShape
    ): any {
        const ref = this.entityManager.findRefById(shape.typeName, id);
        if (ref === undefined) {
            canNotFoundFromCache(`Cannot find the '${shape.typeName}' object whose id is '${id}'`);
        }
        if (ref.value === undefined) {
            return undefined;
        }
        return mapRecord(
            this.entityManager.schema.typeMap.get(shape.typeName)!,
            ref.value,
            shape
        );
    }

    protected async loadAndMerge(
        objMap: Map<string, string>,
        args: QueryArgs,
        missedIds: ReadonlyArray<any>
    ): Promise<ReadonlyArray<any>> {

        const shape = args.shape;
        const idFieldName = this.entityManager.schema.typeMap.get(shape.typeName)!.idField.name;
        const idFieldAlias = shape.fieldMap.get(idFieldName)?.alias ?? idFieldName;

        const missedObjects = await this.entityManager.dataService.query(
            args.newArgs(missedIds).withoutPaginationInfo()
        );
        for (const missedObject of missedObjects) {
            objMap.set(missedObject[idFieldAlias], missedObject);
        }

        return args.ids!.map(id => objMap.get(id));
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
    record: Record | undefined, 
    shape: RuntimeShape
): any {
    if (record === undefined) {
        return undefined;
    }
    let entity: { [key: string]: any };
    if (type.name === "Query") {
        entity = { [type.idField.name]: QUERY_OBJECT_ID };
    } else {
        const idShapeField = shape.fieldMap.get(type.idField.name);
        if (idShapeField === undefined) {
            throw new Error(`Cannot map the record whose type is ${type.name} because its id is included in the shape`);
        }
        entity = { [idShapeField.alias ?? idShapeField.name]: record.id };
    }
    for (const [, shapeField] of shape.fieldMap) {
        if (shapeField.childShape !== undefined) {
            const fieldMetadata = type.fieldMap.get(shapeField.name);
            if (fieldMetadata === undefined) {
                throw new Error(
                    `Cannot map the record whose type is ${type.name} because the shape field "${shapeField.name}" is not a concurrent field`
                );
            }
            const association = record.getAssociation(fieldMetadata, shapeField.args);
            if (association === undefined && !record.hasAssociation(fieldMetadata, shapeField.args)) {
                canNotFoundFromCache(
                    `Cannot find the associaton field '${
                        fieldMetadata.fullName
                    }${
                        `:${shapeField.args?.key}` ?? ""
                    }' for object whose id is '${record.id}'`);
            }
            entity[shapeField.alias ?? shapeField.name] = mapAssociation(
                fieldMetadata, 
                association, 
                fieldMetadata.category === "CONNECTION" ? shapeField.nodeShape! : shapeField.childShape!
            );
        } else if (shapeField.name !== type.idField.name) {
            const scalar = record.getSalar(shapeField.name);
            if (scalar === undefined && !record.hasScalar(shapeField.name)) {
                canNotFoundFromCache(`Cannot find the scalar field '${shapeField.name}' for object whose id is '${record.id}'`);
            }
            entity[shapeField.alias ?? shapeField.name] = scalar;
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

function canNotFoundFromCache(reason: string): never {
    throw { " $canNotFoundFromCache": true, reason };
}