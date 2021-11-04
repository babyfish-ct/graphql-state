import type { AcceptableVariables, UnresolvedVariables, FieldOptions, DirectiveArgs } from 'graphql-ts-client-api';
import { ObjectFetcher, ConnectionFetcher, createFetcher, createFetchableType } from 'graphql-ts-client-api';

/*
 * Any instance of this interface is immutable,
 * all the properties and functions can only be used to create new instances,
 * they cannot modify the current instance.
 * 
 * So any instance of this interface is reuseable.
 */
export interface QueryFetcher<T extends object, TVariables extends object> extends ObjectFetcher<'Query', T, TVariables> {


    directive(name: string, args?: DirectiveArgs): QueryFetcher<T, TVariables>;


    findBookStores<
        X extends object, 
        XVariables extends object
    >(
        child: ObjectFetcher<'BookStore', X, XVariables>
    ): QueryFetcher<
        T & {readonly "findBookStores": readonly X[]}, 
        TVariables & XVariables & QueryArgs["findBookStores"]
    >;

    findBookStores<
        XArgs extends AcceptableVariables<QueryArgs['findBookStores']>, 
        X extends object, 
        XVariables extends object
    >(
        args: XArgs, 
        child: ObjectFetcher<'BookStore', X, XVariables>
    ): QueryFetcher<
        T & {readonly "findBookStores": readonly X[]}, 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['findBookStores']>
    >;

    findBookStores<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findBookStores", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'BookStore', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"findBookStores", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & QueryArgs["findBookStores"] & XDirectiveVariables
    >;

    findBookStores<
        XArgs extends AcceptableVariables<QueryArgs['findBookStores']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findBookStores", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ObjectFetcher<'BookStore', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"findBookStores", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['findBookStores']> & XDirectiveVariables
    >;


    findBooks<
        X extends object, 
        XVariables extends object
    >(
        child: ConnectionFetcher<'BookConnection', X, XVariables>
    ): QueryFetcher<
        T & {readonly "findBooks": X}, 
        TVariables & XVariables & QueryArgs["findBooks"]
    >;

    findBooks<
        XArgs extends AcceptableVariables<QueryArgs['findBooks']>, 
        X extends object, 
        XVariables extends object
    >(
        args: XArgs, 
        child: ConnectionFetcher<'BookConnection', X, XVariables>
    ): QueryFetcher<
        T & {readonly "findBooks": X}, 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['findBooks']>
    >;

    findBooks<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findBooks", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ConnectionFetcher<'BookConnection', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"findBooks", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & QueryArgs["findBooks"] & XDirectiveVariables
    >;

    findBooks<
        XArgs extends AcceptableVariables<QueryArgs['findBooks']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findBooks", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ConnectionFetcher<'BookConnection', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"findBooks", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['findBooks']> & XDirectiveVariables
    >;


    findAuthors<
        X extends object, 
        XVariables extends object
    >(
        child: ConnectionFetcher<'AuthorConnection', X, XVariables>
    ): QueryFetcher<
        T & {readonly "findAuthors": X}, 
        TVariables & XVariables & QueryArgs["findAuthors"]
    >;

    findAuthors<
        XArgs extends AcceptableVariables<QueryArgs['findAuthors']>, 
        X extends object, 
        XVariables extends object
    >(
        args: XArgs, 
        child: ConnectionFetcher<'AuthorConnection', X, XVariables>
    ): QueryFetcher<
        T & {readonly "findAuthors": X}, 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['findAuthors']>
    >;

    findAuthors<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findAuthors", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ConnectionFetcher<'AuthorConnection', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"findAuthors", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & QueryArgs["findAuthors"] & XDirectiveVariables
    >;

    findAuthors<
        XArgs extends AcceptableVariables<QueryArgs['findAuthors']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findAuthors", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ConnectionFetcher<'AuthorConnection', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"findAuthors", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['findAuthors']> & XDirectiveVariables
    >;


    entities<
        X extends object, 
        XVariables extends object
    >(
        child: ObjectFetcher<'Any', X, XVariables>
    ): QueryFetcher<
        T & {readonly "entities": readonly X[]}, 
        TVariables & XVariables & QueryArgs["entities"]
    >;

    entities<
        XArgs extends AcceptableVariables<QueryArgs['entities']>, 
        X extends object, 
        XVariables extends object
    >(
        args: XArgs, 
        child: ObjectFetcher<'Any', X, XVariables>
    ): QueryFetcher<
        T & {readonly "entities": readonly X[]}, 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['entities']>
    >;

    entities<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "entities", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'Any', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"entities", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & QueryArgs["entities"] & XDirectiveVariables
    >;

    entities<
        XArgs extends AcceptableVariables<QueryArgs['entities']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "entities", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ObjectFetcher<'Any', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"entities", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['entities']> & XDirectiveVariables
    >;
}

export const query$: QueryFetcher<{}, {}> = 
    createFetcher(
        createFetchableType(
            "Query", 
            "OBJECT", 
            [], 
            [
                {
                    category: "LIST", 
                    name: "findBookStores", 
                    argGraphQLTypeMap: {name: 'String'}, 
                    targetTypeName: "BookStore"
                }, 
                {
                    category: "CONNECTION", 
                    name: "findBooks", 
                    argGraphQLTypeMap: {
                        delayMillis: 'Int', 
                        before: 'String', 
                        last: 'Int', 
                        after: 'String', 
                        first: 'Int', 
                        name: 'String'
                    }, 
                    connectionTypeName: "BookConnection", 
                    edgeTypeName: "BookEdge", 
                    targetTypeName: "Book"
                }, 
                {
                    category: "CONNECTION", 
                    name: "findAuthors", 
                    argGraphQLTypeMap: {
                        before: 'String', 
                        last: 'Int', 
                        after: 'String', 
                        first: 'Int', 
                        name: 'String'
                    }, 
                    connectionTypeName: "AuthorConnection", 
                    edgeTypeName: "AuthorEdge", 
                    targetTypeName: "Author"
                }, 
                {
                    category: "LIST", 
                    name: "entities", 
                    argGraphQLTypeMap: {
                        ids: '[String!]!', 
                        typeName: 'String!'
                    }, 
                    targetTypeName: "Any"
                }
            ]
        ), 
        undefined
    )
;

export interface QueryArgs {

    readonly findBookStores: {
        readonly name?: string
    }, 

    readonly findBooks: {
        readonly delayMillis?: number, 
        readonly before?: string, 
        readonly last?: number, 
        readonly after?: string, 
        readonly first?: number, 
        readonly name?: string
    }, 

    readonly findAuthors: {
        readonly before?: string, 
        readonly last?: number, 
        readonly after?: string, 
        readonly first?: number, 
        readonly name?: string
    }, 

    readonly entities: {
        readonly ids: readonly string[], 
        readonly typeName: string
    }
}

export interface QueryScalarType {
}

export interface QueryFlatType extends QueryScalarType {
    readonly findBookStores: readonly {
        readonly id: string
    }[];
    readonly findBooks: {
        readonly totalCount: number, 
        readonly edges: readonly {
            readonly node: {
                readonly id: string
            }, 
            readonly cursor: string
        }[], 
        readonly pageInfo: {
            readonly hasNextPage: boolean, 
            readonly hasPreviousPage: boolean, 
            readonly startCursor: string, 
            readonly endCursor: string
        }
    };
    readonly findAuthors: {
        readonly totalCount: number, 
        readonly edges: readonly {
            readonly node: {
                readonly id: string
            }, 
            readonly cursor: string
        }[], 
        readonly pageInfo: {
            readonly hasNextPage: boolean, 
            readonly hasPreviousPage: boolean, 
            readonly startCursor: string, 
            readonly endCursor: string
        }
    };
    readonly entities: readonly {
        readonly id: string
    }[];
}
