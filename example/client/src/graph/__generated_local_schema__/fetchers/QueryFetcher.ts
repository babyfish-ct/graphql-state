import type { FieldOptions, DirectiveArgs } from 'graphql-ts-client-api';
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


    bookStores<
        X extends object, 
        XVariables extends object
    >(
        child: ObjectFetcher<'BookStore', X, XVariables>
    ): QueryFetcher<
        T & {readonly "bookStores": readonly X[]}, 
        TVariables & XVariables
    >;

    bookStores<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "bookStores", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'BookStore', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"bookStores", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & XDirectiveVariables
    >;


    books<
        X extends object, 
        XVariables extends object
    >(
        child: ObjectFetcher<'Book', X, XVariables>
    ): QueryFetcher<
        T & {readonly "books": readonly X[]}, 
        TVariables & XVariables
    >;

    books<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "books", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'Book', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"books", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & XDirectiveVariables
    >;


    authors<
        X extends object, 
        XVariables extends object
    >(
        child: ObjectFetcher<'Author', X, XVariables>
    ): QueryFetcher<
        T & {readonly "authors": readonly X[]}, 
        TVariables & XVariables
    >;

    authors<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "authors", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'Author', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"authors", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & XDirectiveVariables
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
                    name: "bookStores", 
                    targetTypeName: "BookStore"
                }, 
                {
                    category: "LIST", 
                    name: "books", 
                    targetTypeName: "Book"
                }, 
                {
                    category: "LIST", 
                    name: "authors", 
                    targetTypeName: "Author"
                }
            ]
        ), 
        undefined
    )
;

export interface QueryScalarType {
}

export interface QueryFlatType extends QueryScalarType {
    readonly bookStores: readonly {
        readonly id: string
    }[];
    readonly books: readonly {
        readonly id: string
    }[];
    readonly authors: readonly {
        readonly id: string
    }[];
}
