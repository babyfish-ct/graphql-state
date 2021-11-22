import type { AcceptableVariables, UnresolvedVariables, FieldOptions, DirectiveArgs } from 'graphql-ts-client-api';
import { ObjectFetcher, createFetcher, createFetchableType } from 'graphql-ts-client-api';
import type { WithTypeName, ImplementationType } from '../CommonTypes';

/*
 * Any instance of this interface is immutable,
 * all the properties and functions can only be used to create new instances,
 * they cannot modify the current instance.
 * 
 * So any instance of this interface is reuseable.
 */
export interface BookFetcher<T extends object, TVariables extends object> extends ObjectFetcher<'Book', T, TVariables> {

    on<XName extends ImplementationType<'Book'>, X extends object, XVariables extends object>(
        child: ObjectFetcher<XName, X, XVariables>, 
        fragmentName?: string // undefined: inline fragment; otherwise, otherwise, real fragment
    ): BookFetcher<
        XName extends 'Book' ?
        T & X :
        WithTypeName<T, ImplementationType<'Book'>> & (
            WithTypeName<X, ImplementationType<XName>> | 
            {__typename: Exclude<ImplementationType<'Book'>, ImplementationType<XName>>}
        ), 
        TVariables & XVariables
    >;


    directive(name: string, args?: DirectiveArgs): BookFetcher<T, TVariables>;


    readonly __typename: BookFetcher<T & {__typename: ImplementationType<'Book'>}, TVariables>;


    readonly id: BookFetcher<T & {readonly "id": string}, TVariables>;

    "id+"<
        XAlias extends string = "id", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer: (
            options: FieldOptions<"id", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): BookFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~id": BookFetcher<Omit<T, 'id'>, TVariables>;


    readonly name: BookFetcher<T & {readonly "name": string}, TVariables>;

    "name+"<
        XAlias extends string = "name", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer: (
            options: FieldOptions<"name", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): BookFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~name": BookFetcher<Omit<T, 'name'>, TVariables>;


    store<
        X extends object, 
        XVariables extends object
    >(
        child: ObjectFetcher<'BookStore', X, XVariables>
    ): BookFetcher<
        T & {readonly "store"?: X}, 
        TVariables & XVariables
    >;

    store<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "store", 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'BookStore', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"store", {}, {}>
        ) => FieldOptions<XAlias, {readonly [key: string]: DirectiveArgs}, XDirectiveVariables>
    ): BookFetcher<
        T & {readonly [key in XAlias]?: X}, 
        TVariables & XVariables & XDirectiveVariables
    >;


    authors<
        X extends object, 
        XVariables extends object
    >(
        child: ObjectFetcher<'Author', X, XVariables>
    ): BookFetcher<
        T & {readonly "authors": readonly X[]}, 
        TVariables & XVariables & BookArgs["authors"]
    >;

    authors<
        XArgs extends AcceptableVariables<BookArgs['authors']>, 
        X extends object, 
        XVariables extends object
    >(
        args: XArgs, 
        child: ObjectFetcher<'Author', X, XVariables>
    ): BookFetcher<
        T & {readonly "authors": readonly X[]}, 
        TVariables & XVariables & UnresolvedVariables<XArgs, BookArgs['authors']>
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
    ): BookFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & BookArgs["authors"] & XDirectiveVariables
    >;

    authors<
        XArgs extends AcceptableVariables<BookArgs['authors']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "authors", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ObjectFetcher<'Author', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"authors", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): BookFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, BookArgs['authors']> & XDirectiveVariables
    >;
}

export const book$: BookFetcher<{}, {}> = 
    createFetcher(
        createFetchableType(
            "Book", 
            "OBJECT", 
            [], 
            [
                {
                    category: "ID", 
                    name: "id"
                }, 
                "name", 
                {
                    category: "REFERENCE", 
                    name: "store", 
                    targetTypeName: "BookStore", 
                    undefinable: true
                }, 
                {
                    category: "LIST", 
                    name: "authors", 
                    argGraphQLTypeMap: {name: 'String'}, 
                    targetTypeName: "Author"
                }
            ]
        ), 
        undefined
    )
;

export const book$$ = 
    book$
        .id
        .name
;

export interface BookArgs {

    readonly authors: {
        readonly name?: string
    }
}

export interface BookFlatType {
    readonly name: string;
    readonly store?: {
        readonly id: string
    };
    readonly authors: readonly {
        readonly id: string
    }[];
}
