import { ObjectFetcher } from "graphql-ts-client-api";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { OptionArgs, VariableArgs } from "../state/impl/Args";
import { GRAPHQL_STATE_WINDOW_ID, PaginationFetcherProcessor } from "./PaginationFetcherProcessor";
import { RuntimeShape, toRuntimeShape } from "./RuntimeShape";

export class QueryArgs {

    private _key: string;

    private _hasWindowId: boolean;

    private _withWindowId?: QueryArgs;

    private _withoutWindowId?: QueryArgs;

    private constructor(
        readonly shape: RuntimeShape,
        readonly fetcher: ObjectFetcher<string, object, object>,
        readonly pagination: {
            readonly windowId: string,
            readonly connName: string,
        } | undefined,
        readonly ids: ReadonlyArray<any> | undefined,
        readonly optionArgs: OptionArgs | undefined
    ) {
        const variables = optionArgs?.variableArgs?.variables;
        if (variables !== undefined && variables[GRAPHQL_STATE_WINDOW_ID] !== undefined) {
            this._hasWindowId = true;
        }
        if (ids === undefined && optionArgs === undefined) {
            this._key = shape.toString();
        } else {
            this._key = `${
                shape.toString()
            }:${
                optionArgs?.key ?? ""
            }:${
                ids !== undefined ? JSON.stringify(ids) : ""
            }`;
        }
    }

    get key(): string {
        return this._key; 
    }

    static create(
        fetcher: ObjectFetcher<string, object, object>,
        pagination?: {
            readonly windowId: string, 
            readonly schema: SchemaMetadata
        },
        ids?: ReadonlyArray<any>,
        optionArgs?: OptionArgs
    ): QueryArgs {

        if (fetcher.fetchableType.name === 'Query' && ids !== undefined) {
            throw new Error("Generic query does not support id");
        } else if (fetcher.fetchableType.name !== 'Query' && ids === undefined) {
            throw new Error("id/ids is required for object query");
        }

        if (pagination !== undefined) {
            const [connName, paginationFetcher] = new PaginationFetcherProcessor(
                pagination.schema
            ).process(fetcher);
            return new QueryArgs(
                toRuntimeShape(fetcher, connName, optionArgs?.variableArgs?.variables), 
                paginationFetcher, 
                { windowId: pagination.windowId, connName },
                ids,
                optionArgs,
            ).withWindowId();
        }

        return new QueryArgs(
            toRuntimeShape(fetcher, undefined, optionArgs?.variableArgs?.variables), 
            fetcher, 
            undefined,
            ids,
            optionArgs
        );
    }

    newArgs(ids: ReadonlyArray<any>): QueryArgs {
        if (this.ids === undefined) {
            throw new Error(`The function 'missed' is not supported because the current query args is used for object query`);
        }
        return new QueryArgs(this.shape, this.fetcher, undefined, ids, this.optionArgs);
    }

    contains(args: QueryArgs): boolean {
        if (this === args) {
            return true;
        }
        return containsIds(this.ids, args.ids) && containsShape(this.shape, args.shape);
    }

    variables(variables: any): QueryArgs {
        const deltaVariables = 
            variables instanceof VariableArgs ?
            variables.variables :
            variables;
        const optionArgs = OptionArgs.of({
            ...this.optionArgs?.options,
            variables: { 
                ...this.optionArgs?.options?.variables,
                ...deltaVariables
            },
        });
        return new QueryArgs(
            toRuntimeShape(this.fetcher, this.pagination?.connName, optionArgs?.variableArgs?.variables), 
            this.fetcher, 
            this.pagination, 
            this.ids,
            optionArgs
        )
    }

    withWindowId(): QueryArgs {
        if (this.pagination === undefined || this._hasWindowId) {
            return this;
        }
        let w = this._withWindowId;
        if (w === undefined) {
            this._withWindowId = w = this.variables({
                [GRAPHQL_STATE_WINDOW_ID]: this.pagination?.windowId
            });
            w._withoutWindowId = this;
        }
        return w;
    }

    withoutWindowId(): QueryArgs {
        if (this.pagination === undefined || !this._hasWindowId) {
            return this;
        }
        let wo = this._withoutWindowId;
        if (wo === undefined) {
            this._withoutWindowId = wo = this.variables({
                [GRAPHQL_STATE_WINDOW_ID]: undefined
            });
            wo._withWindowId = this;
        }
        return wo;
    }
}

function containsIds(a?: ReadonlyArray<any>, b?: ReadonlyArray<any>): boolean {
    if (a === undefined || b === undefined) {
        if (a !== b) {
            throw new Error("Internal bug: containsIds accept defined ids and undefined ids");
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
        if (fieldA?.args?.key !== field?.args?.key) {
            return false;
        }
        if (!containsShape(fieldA.childShape, field.childShape)) {
            return false;
        }
    }
    return true;
}
