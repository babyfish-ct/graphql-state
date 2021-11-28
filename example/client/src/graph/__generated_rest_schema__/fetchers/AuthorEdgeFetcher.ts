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
export interface AuthorEdgeFetcher<T extends object, TVariables extends object> extends EdgeFetcher<'AuthorEdge', T, TVariables> {

    on<XName extends ImplementationType<'AuthorEdge'>, X extends object, XVariables extends object>(
        child: EdgeFetcher<XName, X, XVariables>, 
        fragmentName?: string // undefined: inline fragment; otherwise, otherwise, real fragment
    ): AuthorEdgeFetcher<
        XName extends 'AuthorEdge' ?
        T & X :
        WithTypeName<T, ImplementationType<'AuthorEdge'>> & (
            WithTypeName<X, ImplementationType<XName>> | 
            {__typename: Exclude<ImplementationType<'AuthorEdge'>, ImplementationType<XName>>}
        ), 
        TVariables & XVariables
    >;


    directive(name: string, args?: DirectiveArgs): AuthorEdgeFetcher<T, TVariables>;


    readonly __typename: AuthorEdgeFetcher<T & {__typename: ImplementationType<'AuthorEdge'>}, TVariables>;


    node<
        X extends object, 
        XVariables extends object
    >(
        child: ObjectFetcher<'Author', X, XVariables>
    ): AuthorEdgeFetcher<
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
        child: ObjectFetcher<'Author', X, XVariables>, 
        optionsConfigurer: (
            options: FieldOptions<"node", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): AuthorEdgeFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & XDirectiveVariables
    >;


    readonly cursor: AuthorEdgeFetcher<T & {readonly "cursor": string}, TVariables>;

    "cursor+"<
        XAlias extends string = "cursor", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer: (
            options: FieldOptions<"cursor", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): AuthorEdgeFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~cursor": AuthorEdgeFetcher<Omit<T, 'cursor'>, TVariables>;
}

export const authorEdge$: AuthorEdgeFetcher<{}, {}> = 
    createFetcher(
        createFetchableType(
            "AuthorEdge", 
            "EDGE", 
            [], 
            [
                {
                    category: "REFERENCE", 
                    name: "node", 
                    targetTypeName: "Author"
                }, 
                "cursor"
            ]
        ), 
        undefined
    )
;

export const authorEdge$$ = 
    authorEdge$
        .cursor
;
