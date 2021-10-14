import { ObjectFetcher } from "graphql-ts-client-api";
import { standardizedVariables } from "../state/impl/Variables";
import { RuntimeShape, toRuntimeShape } from "./RuntimeShape";

export class QueryArgs {

    private _key: string;

    private constructor(
        readonly shape: RuntimeShape,
        readonly fetcher: ObjectFetcher<string, object, object>,
        readonly ids?: ReadonlyArray<any>,
        readonly variables?: any
    ) {
        if (variables === undefined) {
            this._key = shape.toString();
        } else {
            this._key = `${shape.toString()}:${JSON.stringify(variables)}`;
        }
    }

    get key(): string {
        return this._key; 
    }

    static create(
        fetcher: ObjectFetcher<string, object, object>,
        ids?: ReadonlyArray<any>,
        variables?: any
    ): QueryArgs {
        if (fetcher.fetchableType.name === 'Query' && ids !== undefined) {
            throw new Error("Generic query does not support id");
        } else if (fetcher.fetchableType.name !== 'Query' && ids === undefined) {
            throw new Error("Id is required for object query");
        }
        const vs = standardizedVariables(variables);
        return new QueryArgs(
            toRuntimeShape(fetcher, variables), 
            fetcher, 
            ids, 
            vs
        );
    }

    newArgs(ids: ReadonlyArray<any>): QueryArgs {
        if (this.ids === undefined) {
            throw new Error(`The function 'missed' is not supported because the current query args is used for object query`);
        }
        return new QueryArgs(this.shape, this.fetcher, ids, this.variables);
    }

    contains(args: QueryArgs): boolean {
        if (this === args) {
            return true;
        }
        return containsIds(this.ids, args.ids) && containsShape(this.shape, args.shape);
    }
}

function containsIds(a?: ReadonlyArray<any>, b?: ReadonlyArray<any>): boolean {
    if (a === undefined || b === undefined) {
        if (a !== b) {
            throw new Error("Internal bug: containsShape accept defined ids and undefined ids");
        }
        return true;
    }
    if (a.length < b.length) {
        return false;
    }
    for (const id of b) {
        if (a.findIndex(e => e === id) === -1) {
            return false;
        }
    }
    return true;
}

function containsShape(a?: RuntimeShape, b?: RuntimeShape): boolean {
    if (a === undefined || b === undefined) {
        if (a !== b) {
            throw new Error("Internal bug: containsShape accept defined shape and undefined shape");
        }
        return true;
    }
    if (a.typeName !== b.typeName) {
        return false;
    }
    for (const [fieldName, field] of b.fieldMap) {
        const fieldA = a.fieldMap.get(fieldName);
        if (fieldA === undefined) {
            return false;
        }
        if (fieldA.variables !== field.variables && JSON.stringify(fieldA.variables) !== JSON.stringify(field.variables)) {
            return false;
        }
        if (!containsShape(fieldA.childShape, field.childShape)) {
            return false;
        }
    }
    return true;
}
