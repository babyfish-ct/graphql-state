import { Fetcher, FetcherField, ObjectFetcher, ParameterRef } from "graphql-ts-client-api"
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";

export class PaginationFetcherProcessor {

    constructor(private schema: SchemaMetadata) {}
    
    process(
        fetcher: ObjectFetcher<string, object, object>
    ): [string, string | undefined, ObjectFetcher<string, object, object>] {
        const [connName, connField] = this.findConnectionField(fetcher);
        return [connName, connField.fieldOptionsValue?.alias, this.adjustConnection(fetcher, connName, connField)];
    }

    private findConnectionField(
        fetcher: Fetcher<string, object, object>
    ): [string, FetcherField] {
        const fetchableFieldMap = fetcher.fetchableType.fields;
        let connName: string | undefined = undefined;
        let connField: FetcherField | undefined = undefined;
        for (const [name, field] of fetcher.fieldMap) {
            const fetchableField = fetchableFieldMap.get(name);
            if (fetchableField?.category === "CONNECTION") {
                if (connName !== undefined) {
                    throw new Error(
                        `Cannot parse pagiation query because there are two root connection fields of the fetcher: ` +
                        `"${connName}" and "${name}"`
                    );
                }
                connName = name;
                connField = field;
            }
        }
        if (connName === undefined || connField === undefined) {
            throw new Error(
                `Cannot parse pagiation query because there are no connection root fields of the fetcher`
            );
        }
        for (const argName of CONN_ARG_NAMES) {
            if (connField.argGraphQLTypes?.has(argName) !== true) {
                throw new Error(`Cannot parse pagiation query because there is not argument "${argName}" of connection field "${connName}"`);
            }
            if (isArgumentSpecified(connField.args, argName)) {
                throw new Error(`Cannot parse pagiation query, the argument "${argName}" of connection field "${connName}" cannot be specified`);
            }
        }
        return [connName, connField];
    }

    private adjustConnection(
        fetcher: ObjectFetcher<string, object, object>,
        connName: string,
        connField: FetcherField
    ): ObjectFetcher<string, object, object> {
        if (connField.childFetchers === undefined) {
            throw new Error(`No child fetcher for connection`);
        }
        return fetcher["addField"](
            connName,
            { 
                ...connField.args,
                first: ParameterRef.of(GRAPHQL_STATE_FIRST),
                after: ParameterRef.of(GRAPHQL_STATE_AFTER),
                last: ParameterRef.of(GRAPHQL_STATE_LAST),
                before: ParameterRef.of(GRAPHQL_STATE_BEFORE)
            },
            this.adjustPageInfo(connField.childFetchers[0]),
            connField.fieldOptionsValue
        );
    }

    private adjustPageInfo(
        connFetcher: Fetcher<string, object, object>
    ): Fetcher<string, object, object> {
        const pageInfoFetchableField = connFetcher.fetchableType.fields.get("pageInfo");
        if (pageInfoFetchableField === undefined) {
            throw new Error(`No field "pageInfo" declared in "${connFetcher.fetchableType.name}"`);
        }
        if (pageInfoFetchableField.targetTypeName === undefined) {
            throw new Error(`The field "pageInfo" of "${connFetcher.fetchableType.name}" cannot be simple scalar type`);
        }
        const pageInfoFetcher = this.schema.fetcher(pageInfoFetchableField.targetTypeName);
        if (pageInfoFetcher === undefined) {
            throw new Error(`No fetcher for "${pageInfoFetchableField.targetTypeName}" is added into schema`);
        }
        for (const argName of PAGE_ARG_NAMES) {
            if (!pageInfoFetcher.fetchableType.fields.has(argName)) {
                throw new Error(`There is no field "${argName}" declared in "${pageInfoFetchableField.targetTypeName}"`);
            }
            if (pageInfoFetcher.fetchableType.fields.get(argName)!.isFunction) {
                throw new Error(`The field "${argName}" declared in "${pageInfoFetchableField.targetTypeName}" must be simple field`);
            }
        }
        const pageInfoField = connFetcher.findField("pageInfo");
        if (pageInfoField === undefined) {
            return connFetcher["pageInfo"](
                pageInfoFetcher["hasNextPage"]["hasPreviousPage"]["startCursor"]["endCursor"]
            );
        }
        let existingPageInfoFetcher = pageInfoField.childFetchers![0];
        for (const argName of PAGE_ARG_NAMES) {
            if (!existingPageInfoFetcher.findField("argName") === undefined) {
                existingPageInfoFetcher = existingPageInfoFetcher[argName];
            }
        }
        return connFetcher["addField"](
            "pageInfo",
            undefined,
            existingPageInfoFetcher,
            connFetcher.fieldMap.get("pageInfo")?.fieldOptionsValue
        );
    }
}

function graphqlStateVariableName(name: string): string {
    return `graphql_state_${name}__`;
}
export const GRAPHQL_STATE_PAGINATION_INFO = graphqlStateVariableName("pagination_info");
export const GRAPHQL_STATE_FIRST = graphqlStateVariableName("first");
export const GRAPHQL_STATE_AFTER = graphqlStateVariableName("after");
export const GRAPHQL_STATE_LAST = graphqlStateVariableName("last");
export const GRAPHQL_STATE_BEFORE = graphqlStateVariableName("before");

function isArgumentSpecified(args: any, name: string) {
    if (args !== undefined) {
        const value = args[name];
        if (value !== undefined) {
            if (value[" $__instanceOfParameterRef"]) {
                const refName = (value as ParameterRef<any>).name;
                if (refName === name || refName === graphqlStateVariableName(name)) {
                    return false;
                }
            }
            return true;
        }
    }
    return false;
}

const CONN_ARG_NAMES = ["first", "after", "last", "before"];

const PAGE_ARG_NAMES = ["hasNextPage", "hasPreviousPage", "startCursor", "endCursor"];
