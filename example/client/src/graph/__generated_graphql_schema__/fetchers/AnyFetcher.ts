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
export interface AnyFetcher<T extends object, TVariables extends object> extends ObjectFetcher<'Any', T, TVariables> {

    on<XName extends ImplementationType<'Any'>, X extends object, XVariables extends object>(
        child: ObjectFetcher<XName, X, XVariables>, 
        fragmentName?: string // undefined: inline fragment; otherwise, otherwise, real fragment
    ): AnyFetcher<
        XName extends 'Any' ?
        T & X :
        WithTypeName<T, ImplementationType<'Any'>> & (
            WithTypeName<X, ImplementationType<XName>> | 
            {__typename: Exclude<ImplementationType<'Any'>, ImplementationType<XName>>}
        ), 
        TVariables & XVariables
    >;


    directive(name: string, args?: DirectiveArgs): AnyFetcher<T, TVariables>;


    readonly __typename: AnyFetcher<T & {__typename: ImplementationType<'Any'>}, TVariables>;


    readonly id: AnyFetcher<T & {readonly "id": string}, TVariables>;

    "id+"<
        XAlias extends string = "id", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer: (
            options: FieldOptions<"id", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): AnyFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~id": AnyFetcher<Omit<T, 'id'>, TVariables>;
}

export const any$: AnyFetcher<{}, {}> = 
    createFetcher(
        createFetchableType(
            "Any", 
            "OBJECT", 
            [], 
            [
                {
                    category: "ID", 
                    name: "id"
                }
            ]
        ), 
        undefined
    )
;

export const any$$ = 
    any$
        .id
;
