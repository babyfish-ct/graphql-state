import { RuntimeShape } from "../entities/RuntimeShape";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";

export function reshapeObject(schema: SchemaMetadata, obj: any, shape: RuntimeShape): any {
    if (obj === undefined || obj === null) {
        return undefined;
    }
    if (Array.isArray(obj)) {
        return obj.map(element => reshapeObject(schema, element, shape));
    }
    const type = schema.typeMap.get(shape.typeName)!;
    if (type === undefined) {
        throw new Error(`Illegal object type ${shape}`);
    }
    const result: any = {};
    for (const [, field] of shape.fieldMap) {
        const name = field.alias ?? field.name;
        let value = obj[name];
        if (value === null) {
            value = undefined;
        }
        if (type.fieldMap.get(name)?.category === 'CONNECTION') {
            result[name] = reshapeConnnection(schema, value, field.nodeShape!);
        } else if (field.childShape !== undefined) {
            result[name] = reshapeObject(schema, value, field.childShape);
        } else {
            result[name] = value;
        }
    }
    return result;
}

function reshapeConnnection(schema: SchemaMetadata, connection: any, nodeShape: RuntimeShape) {
    const edges = connection
        .edges
        .map((edge: any) => {
            return {
                ...edge,
                node: reshapeObject(schema, edge.node, nodeShape)
            }
        });
    return {
        ...connection,
        edges
    };
}

export class ObjectFilter {

    private _objMap: Map<any, any>;

    constructor(
        private schema: SchemaMetadata, 
        private data: any,
        private ids: ReadonlyArray<any> | undefined, 
        private shape: RuntimeShape
    ) {}

    get(ids: ReadonlyArray<any> | undefined): any {
        if (this.ids === undefined || ids === undefined || JSON.stringify(this.ids) === JSON.stringify(ids)) {
            return this.data;
        }
        return ids.map(id => this.objMap.get(id));
    }

    private get objMap(): Map<string, any> {
        let map = this._objMap;
        if (map === undefined) {
            this._objMap = map = this.createObjMap();
        }
        return map;
    }

    private createObjMap() {
        const type = this.schema.typeMap.get(this.shape.typeName);
        if (type === undefined) {
            throw new Error(`Illegal object type ${this.shape}`);
        }
        const idShapeField = this.shape.fieldMap.get(type.idField.name);
        if (idShapeField === undefined) {
            throw new Error(`id field ${type.name}.${type.idField.name} is not included by shape`);
        }
        const arr = Array.isArray(this.data) ? this.data : this.data["entities"];
        if (!Array.isArray(arr)) {
            throw new Error(
                "For objects loading, the remote loader must return an array or an object with an array field named 'entities'"
            );
        }
        const objMap = new Map<any, any>();
        for (const obj of arr) {
            const id = obj[idShapeField.alias ?? idShapeField.name];
            if (id === undefined || id === null) {
                throw new Error(`Illegal object whose value of id field ${type.name}.${type.idField.name} is not specified`);
            }
            objMap.set(id, obj);
        }
        return objMap;
    }
}
