import type { AcceptableVariables, UnresolvedVariables, FieldOptions, DirectiveArgs } from 'graphql-ts-client-api';
import { ObjectFetcher, createFetcher, createFetchableType } from 'graphql-ts-client-api';

/*
 * Any instance of this interface is immutable,
 * all the properties and functions can only be used to create new instances,
 * they cannot modify the current instance.
 * 
 * So any instance of this interface is reuseable.
 */
export interface QueryFetcher<T extends object, TVariables extends object> extends ObjectFetcher<'Query', T, TVariables> {


    directive(name: string, args?: DirectiveArgs): QueryFetcher<T, TVariables>;


    findBooksStores<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findBooksStores", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'BookStore', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"findBooksStores", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & QueryArgs["findBooksStores"] & XDirectiveVariables
    >;

    findBooksStores<
        XArgs extends AcceptableVariables<QueryArgs['findBooksStores']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findBooksStores", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ObjectFetcher<'BookStore', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"findBooksStores", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['findBooksStores']> & XDirectiveVariables
    >;


    findBooks<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findBooks", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'Book', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"findBooks", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
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
        child: ObjectFetcher<'Book', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"findBooks", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['findBooks']> & XDirectiveVariables
    >;


    findAuthors<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findAuthors", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'Author', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"findAuthors", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
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
        child: ObjectFetcher<'Author', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"findAuthors", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['findAuthors']> & XDirectiveVariables
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
                    name: "findBooksStores", 
                    argGraphQLTypeMap: {name: 'String'}, 
                    targetTypeName: "BookStore"
                }, 
                {
                    category: "LIST", 
                    name: "findBooks", 
                    argGraphQLTypeMap: {name: 'String'}, 
                    targetTypeName: "Book"
                }, 
                {
                    category: "LIST", 
                    name: "findAuthors", 
                    argGraphQLTypeMap: {name: 'String'}, 
                    targetTypeName: "Author"
                }
            ]
        ), 
        undefined
    )
;

export interface QueryArgs {

    readonly findBooksStores: {
        readonly name?: string
    }, 

    readonly findBooks: {
        readonly name?: string
    }, 

    readonly findAuthors: {
        readonly name?: string
    }
}