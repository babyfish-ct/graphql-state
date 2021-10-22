import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { RecordConnection } from "./assocaition/AssociationConnectionValue";;
import { EntityManager } from "./EntityManager";
import { QueryArgs } from "./QueryArgs";
import { QUERY_OBJECT_ID, Record } from "./Record";
import { RuntimeShape } from "./RuntimeShape";

export class QueryService {

    constructor(private entityManager: EntityManager) {}

    query(args: QueryArgs): RawQueryResult<any> {
        if (args.ids === undefined) {
            return this.graph(args);
        }
        return this.objects(args);
    }

    private graph(args: QueryArgs): RawQueryResult<any> {

        try {
            return {
                type: "cached",
                data: this.findObject(QUERY_OBJECT_ID, args.shape)
            }
        } catch (ex) {
            if (!ex[" $canNotFoundFromCache"]) {
                throw ex;
            }
            console.log(ex["reason"]);
        }

        return {
            type: "deferred",
            promise: this.entityManager.dataService.query(args)
        };
    }

    private objects(args: QueryArgs): RawQueryResult<ReadonlyArray<any>> {
        const ids = args.ids!;
        if (ids.length === 0) {
            return {
                type: "cached",
                data: []
            }
        }
        
        const map = this.findObjects(ids, args.shape);
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
            promise: this.loadAndMerge(map, args, missedIds)
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

        const missedObjects = await this.entityManager.dataService.query(args.newArgs(missedIds));
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
    runtimeSchape: RuntimeShape
): any {
    if (record === undefined) {
        return undefined;
    }
    const idFieldName = type.idField.name;
    const entity = { [idFieldName]: record.id };
    for (const [, field] of runtimeSchape.fieldMap) {
        if (field.childShape !== undefined) {
            const fieldMetadata = type.fieldMap.get(field.name);
            if (fieldMetadata === undefined) {
                throw new Error(`Cannot find the method for field "${type.name}.${field.name}"`);
            }
            const association = record.getAssociation(fieldMetadata, field.args);
            if (association === undefined && !record.hasAssociation(fieldMetadata, field.args)) {
                canNotFoundFromCache(
                    `Cannot find the associaton field '${
                        fieldMetadata.fullName
                    }${
                        `:${field.args?.key}` ?? ""
                    }' for object whose id is '${record.id}'`);
            }
            entity[field.alias ?? field.name] = mapAssociation(
                fieldMetadata, 
                association, 
                fieldMetadata.category === "CONNECTION" ? field.nodeShape! : field.childShape!
            );
        } else if (field.name !== idFieldName) {
            const scalar = record.getSalar(field.name);
            if (scalar === undefined && !record.hasScalar(field.name)) {
                canNotFoundFromCache(`Cannot find the scalar field '${field.name}' for object whose id is '${record.id}'`);
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

function canNotFoundFromCache(reason: string): never {
    throw { " $canNotFoundFromCache": true, reason };
}