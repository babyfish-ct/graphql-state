import { util } from "graphql-ts-client-api";
import { EntityManager } from "../entities/EntityManager";
import { QueryArgs } from "../entities/QueryArgs";
import { RuntimeShape } from "../entities/RuntimeShape";

export abstract class AbstractDataService {

    constructor(readonly entityManager: EntityManager) {}

    abstract query(args: QueryArgs): Promise<any>;

    toObjectMap(data: any, args: QueryArgs): Map<any, any> {
        const ids = args.ids;
        if (ids === undefined) {
            throw new Error(`'toObjectMap' is not supported for the query args that is not used to load objects`);
        }
        const shape = args.shape;
        const objs = Array.isArray(data) ? data : data["entities"];
        if (!Array.isArray(objs)) {
            throw new Error("For objects loading, the remote loader must return an array or an object with an array field named 'entities'");
        }
        const idFieldName = this.entityManager.schema.typeMap.get(shape.typeName)!.idField.name;
        const idFieldAlias = shape.fieldMap.get(idFieldName)?.alias ?? idFieldName;
        const objMap = new Map<any, any>();
        for (const obj of objs) {
            objMap.set(obj[idFieldAlias], obj !== null ? obj : undefined);
        }
        return objMap;
    }

    protected standardizedResult(data: any, args: QueryArgs, reshapeObject: boolean = false): any {
        if (data === undefined || data === null) {
            return undefined;
        }
        if (args.ids !== undefined) {
            const objMap = this.toObjectMap(data, args);
            return args.ids.map(id => {
                const obj = objMap.get(id);
                return reshapeObject ? this.reshapeObject(obj, args.shape) : obj;
            });
        }
        return reshapeObject ? this.reshapeObject(data, args.shape) : data;
    }

    private reshapeObject(obj: any, shape: RuntimeShape): any {
        if (obj === undefined || obj === null) {
            return undefined;
        }
        if (Array.isArray(obj)) {
            return obj.map(element => this.reshapeObject(element, shape));
        }
        const type = this.entityManager.schema.typeMap.get(shape.typeName)!;
        const result: any = {};
        for (const [, field] of shape.fieldMap) {
            const name = field.alias ?? field.name;
            let value = obj[name];
            if (value === null) {
                value = undefined;
            }
            if (type.fieldMap.get(name)?.category === 'CONNECTION') {
                result[name] = this.reshapeConnnection(value, field.childShape!);
            } else if (field.childShape !== undefined) {
                result[name] = this.reshapeObject(value, field.childShape);
            } else {
                result[name] = value;
            }
        }
        return result;
    }

    private reshapeConnnection(connection: any, nodeShape: RuntimeShape) {
        const edges = connection
            .edges
            .map((edge: any) => {
                return {
                    ...edge,
                    node: this.reshapeObject(edge.node, nodeShape)
                }
            });
        return {
            ...connection,
            edges
        };
    }

    abstract onExecute(args: QueryArgs): Promise<any>;

    abstract onExecuted(args: QueryArgs, data: any): void;

    abstract onComplete(args: QueryArgs): void;
}
