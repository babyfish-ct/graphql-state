import type { FieldOptions, DirectiveArgs } from 'graphql-ts-client-api';
import { ObjectFetcher, createFetcher, createFetchableType } from 'graphql-ts-client-api';
import type { WithTypeName, ImplementationType } from '../CommonTypes';

/*
 * Any instance of this interface is immutable,
 * all the properties and functions can only be used to create new instances,
 * they cannot modify the current instance.
 * 
 * So any instance of this interface is reuseable.
 */
export interface BookStoreFetcher<T extends object, TVariables extends object> extends ObjectFetcher<'BookStore', T, TVariables> {

    on<XName extends ImplementationType<'BookStore'>, X extends object, XVariables extends object>(
        child: ObjectFetcher<XName, X, XVariables>, 
        fragmentName?: string // undefined: inline fragment; otherwise, otherwise, real fragment
    ): BookStoreFetcher<
        XName extends 'BookStore' ?
        T & X :
        WithTypeName<T, ImplementationType<'BookStore'>> & (
            WithTypeName<X, ImplementationType<XName>> | 
            {__typename: Exclude<ImplementationType<'BookStore'>, ImplementationType<XName>>}
        ), 
        TVariables & XVariables
    >;


    directive(name: string, args?: DirectiveArgs): BookStoreFetcher<T, TVariables>;


    readonly __typename: BookStoreFetcher<T & {__typename: ImplementationType<'BookStore'>}, TVariables>;


    readonly id: BookStoreFetcher<T & {readonly "id": string}, TVariables>;

    "id+"<
        XAlias extends string = "id", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer: (
            options: FieldOptions<"id", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): BookStoreFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~id": BookStoreFetcher<Omit<T, 'id'>, TVariables>;


    readonly name: BookStoreFetcher<T & {readonly "name": string}, TVariables>;

    "name+"<
        XAlias extends string = "name", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer: (
            options: FieldOptions<"name", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): BookStoreFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~name": BookStoreFetcher<Omit<T, 'name'>, TVariables>;


    books<
        X extends object, 
        XVariables extends object
    >(
        child: ObjectFetcher<'Book', X, XVariables>
    ): BookStoreFetcher<
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
    ): BookStoreFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & XDirectiveVariables
    >;
}

export const bookStore$: BookStoreFetcher<{}, {}> = 
    createFetcher(
        createFetchableType(
            "BookStore", 
            "OBJECT", 
            [], 
            [
                {
                    category: "ID", 
                    name: "id"
                }, 
                "name", 
                {
                    category: "LIST", 
                    name: "books", 
                    targetTypeName: "Book"
                }
            ]
        ), 
        undefined
    )
;

export const bookStore$$ = 
    bookStore$
        .id
        .name
;

export interface BookStoreScalarType {
    readonly name: string;
}

export interface BookStoreFlatType extends BookStoreScalarType {
    readonly books: readonly {
        readonly id: string
    }[];
}
