import { ObjectFetcher } from "graphql-ts-client-api";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { OptionArgs, VariableArgs } from "../state/impl/Args";
import { PaginationQueryOptions, PaginationStyle } from "../state/Types";
import { GRAPHQL_STATE_PAGINATION_INFO, PaginationFetcherProcessor } from "./PaginationFetcherProcessor";
import { RuntimeShape, toRuntimeShape } from "./RuntimeShape";

export class QueryArgs {

    private _key: string;

    private _hasPaginationInfo: boolean;

    private _withPaginationInfo?: QueryArgs;

    private _withoutPaginationInfo?: QueryArgs;

    private constructor(
        readonly shape: RuntimeShape,
        readonly fetcher: ObjectFetcher<string, object, object>,
        readonly pagination: Pagination | undefined,
        readonly ids: ReadonlyArray<any> | undefined,
        readonly optionArgs: OptionArgs | undefined
    ) {
        const variables = optionArgs?.variableArgs?.variables;
        if (variables !== undefined && variables[GRAPHQL_STATE_PAGINATION_INFO] !== undefined) {
            this._hasPaginationInfo = true;
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
            readonly schema: SchemaMetadata,
            readonly loadMode: "initial" | "next" | "previous",
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
            
            const [connName, connAlias, paginationFetcher] = new PaginationFetcherProcessor(
                pagination.schema
            ).process(fetcher);
            const queryOptions = optionArgs!.options as PaginationQueryOptions<any, any>;

            return new QueryArgs(
                toRuntimeShape(fetcher, connName, optionArgs?.variableArgs?.variables), 
                paginationFetcher, 
                { 
                    loadMode: pagination.loadMode,
                    windowId: queryOptions.windowId, 
                    connName,
                    connAlias,
                    style: queryOptions.paginiationStyle ?? "forward",
                    initialSize: queryOptions.initialSize,
                    pageSize: queryOptions.pageSize ?? queryOptions.initialSize
                },
                ids,
                optionArgs,
            ).withPaginationInfo();
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

    withPaginationInfo(): QueryArgs {
        if (this.pagination === undefined || this._hasPaginationInfo) {
            return this;
        }
        let w = this._withPaginationInfo;
        if (w === undefined) {
            const paginationInfo: PaginationInfo = {
                windowId: this.pagination.windowId,
                style: this.pagination.style,
                initialSize: this.pagination.initialSize
            };
            this._withPaginationInfo = w = this.variables({
                [GRAPHQL_STATE_PAGINATION_INFO]: paginationInfo
            });
            w._withoutPaginationInfo = this;
        }
        return w;
    }

    withoutPaginationInfo(): QueryArgs {
        if (this.pagination === undefined || !this._hasPaginationInfo) {
            return this;
        }
        let wo = this._withoutPaginationInfo;
        if (wo === undefined) {
            this._withoutPaginationInfo = wo = this.variables({
                [GRAPHQL_STATE_PAGINATION_INFO]: undefined
            });
            wo._withPaginationInfo = this;
        }
        return wo;
    }
}

export interface Pagination {
    readonly loadMode: "initial" | "next" | "previous";
    readonly windowId: string;
    readonly connName: string;
    readonly connAlias?: string;
    readonly style: PaginationStyle;
    readonly initialSize: number;
    readonly pageSize: number;
}

export interface PaginationInfo {
    windowId: string;
    style: PaginationStyle;
    initialSize: number;
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
