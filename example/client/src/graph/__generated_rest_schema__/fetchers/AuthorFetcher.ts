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
export interface AuthorFetcher<T extends object, TVariables extends object> extends ObjectFetcher<'Author', T, TVariables> {

    on<XName extends ImplementationType<'Author'>, X extends object, XVariables extends object>(
        child: ObjectFetcher<XName, X, XVariables>, 
        fragmentName?: string // undefined: inline fragment; otherwise, otherwise, real fragment
    ): AuthorFetcher<
        XName extends 'Author' ?
        T & X :
        WithTypeName<T, ImplementationType<'Author'>> & (
            WithTypeName<X, ImplementationType<XName>> | 
            {__typename: Exclude<ImplementationType<'Author'>, ImplementationType<XName>>}
        ), 
        TVariables & XVariables
    >;


    directive(name: string, args?: DirectiveArgs): AuthorFetcher<T, TVariables>;


    readonly __typename: AuthorFetcher<T & {__typename: ImplementationType<'Author'>}, TVariables>;


    readonly id: AuthorFetcher<T & {readonly "id": string}, TVariables>;

    "id+"<
        XAlias extends string = "id", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer: (
            options: FieldOptions<"id", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): AuthorFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~id": AuthorFetcher<Omit<T, 'id'>, TVariables>;


    readonly name: AuthorFetcher<T & {readonly "name": string}, TVariables>;

    "name+"<
        XAlias extends string = "name", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer: (
            options: FieldOptions<"name", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): AuthorFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~name": AuthorFetcher<Omit<T, 'name'>, TVariables>;


    books<
        X extends object, 
        XVariables extends object
    >(
        child: ObjectFetcher<'Book', X, XVariables>
    ): AuthorFetcher<
        T & {readonly "books": readonly X[]}, 
        TVariables & XVariables & AuthorArgs["books"]
    >;

    books<
        XArgs extends AcceptableVariables<AuthorArgs['books']>, 
        X extends object, 
        XVariables extends object
    >(
        args: XArgs, 
        child: ObjectFetcher<'Book', X, XVariables>
    ): AuthorFetcher<
        T & {readonly "books": readonly X[]}, 
        TVariables & XVariables & UnresolvedVariables<XArgs, AuthorArgs['books']>
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
    ): AuthorFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & AuthorArgs["books"] & XDirectiveVariables
    >;

    books<
        XArgs extends AcceptableVariables<AuthorArgs['books']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "books", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ObjectFetcher<'Book', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"books", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): AuthorFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, AuthorArgs['books']> & XDirectiveVariables
    >;
}

export const author$: AuthorFetcher<{}, {}> = 
    createFetcher(
        createFetchableType(
            "Author", 
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
                    argGraphQLTypeMap: {name: 'String'}, 
                    targetTypeName: "Book"
                }
            ]
        ), 
        undefined
    )
;

export const author$$ = 
    author$
        .id
        .name
;

export interface AuthorArgs {

    readonly books: {
        readonly name?: string
    }
}

export interface AuthorFlatType {
    readonly name: string;
    readonly books: readonly {
        readonly id: string
    }[];
}
