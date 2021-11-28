import type { FieldOptions, DirectiveArgs } from 'graphql-ts-client-api';
import { EdgeFetcher, ObjectFetcher, createFetcher, createFetchableType } from 'graphql-ts-client-api';
import type { WithTypeName, ImplementationType } from '../CommonTypes';

/*
 * Any instance of this interface is immutable,
 * all the properties and functions can only be used to create new instances,
 * they cannot modify the current instance.
 * 
 * So any instance of this interface is reuseable.
 */
export interface BookEdgeFetcher<T extends object, TVariables extends object> extends EdgeFetcher<'BookEdge', T, TVariables> {

    on<XName extends ImplementationType<'BookEdge'>, X extends object, XVariables extends object>(
        child: EdgeFetcher<XName, X, XVariables>, 
        fragmentName?: string // undefined: inline fragment; otherwise, otherwise, real fragment
    ): BookEdgeFetcher<
        XName extends 'BookEdge' ?
        T & X :
        WithTypeName<T, ImplementationType<'BookEdge'>> & (
            WithTypeName<X, ImplementationType<XName>> | 
            {__typename: Exclude<ImplementationType<'BookEdge'>, ImplementationType<XName>>}
        ), 
        TVariables & XVariables
    >;


    directive(name: string, args?: DirectiveArgs): BookEdgeFetcher<T, TVariables>;


    readonly __typename: BookEdgeFetcher<T & {__typename: ImplementationType<'BookEdge'>}, TVariables>;


    node<
        X extends object, 
        XVariables extends object
    >(
        child: ObjectFetcher<'Book', X, XVariables>
    ): BookEdgeFetcher<
        T & {readonly "node": X}, 
        TVariables & XVariables
    >;

    node<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "node", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'Book', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"node", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): BookEdgeFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & XDirectiveVariables
    >;


    readonly cursor: BookEdgeFetcher<T & {readonly "cursor": string}, TVariables>;

    "cursor+"<
        XAlias extends string = "cursor", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer: (
            options: FieldOptions<"cursor", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): BookEdgeFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~cursor": BookEdgeFetcher<Omit<T, 'cursor'>, TVariables>;
}

export const bookEdge$: BookEdgeFetcher<{}, {}> = 
    createFetcher(
        createFetchableType(
            "BookEdge", 
            "EDGE", 
            [], 
            [
                {
                    category: "REFERENCE", 
                    name: "node", 
                    targetTypeName: "Book"
                }, 
                "cursor"
            ]
        ), 
        undefined
    )
;

export const bookEdge$$ = 
    bookEdge$
        .cursor
;
