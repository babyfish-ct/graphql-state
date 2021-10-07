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
export interface EmployeeFetcher<T extends object, TVariables extends object> extends ObjectFetcher<'Employee', T, TVariables> {

    on<XName extends ImplementationType<'Employee'>, X extends object, XVariables extends object>(
        child: ObjectFetcher<XName, X, XVariables>, 
        fragmentName?: string // undefined: inline fragment; otherwise, otherwise, real fragment
    ): EmployeeFetcher<
        XName extends 'Employee' ?
        T & X :
        WithTypeName<T, ImplementationType<'Employee'>> & (
            WithTypeName<X, ImplementationType<XName>> | 
            {__typename: Exclude<ImplementationType<'Employee'>, ImplementationType<XName>>}
        ), 
        TVariables & XVariables
    >;


    directive(name: string, args?: DirectiveArgs): EmployeeFetcher<T, TVariables>;


    readonly __typename: EmployeeFetcher<T & {__typename: ImplementationType<'Employee'>}, TVariables>;


    readonly id: EmployeeFetcher<T & {readonly "id": string}, TVariables>;

    "id+"<
        XAlias extends string = "id", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer?: (
            options: FieldOptions<"id", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): EmployeeFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~id": EmployeeFetcher<Omit<T, 'id'>, TVariables>;


    readonly name: EmployeeFetcher<T & {readonly "name": string}, TVariables>;

    "name+"<
        XAlias extends string = "name", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer?: (
            options: FieldOptions<"name", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): EmployeeFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~name": EmployeeFetcher<Omit<T, 'name'>, TVariables>;


    department<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "department", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'Department', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"department", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): EmployeeFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & XDirectiveVariables
    >;
}

export const employee$: EmployeeFetcher<{}, {}> = 
    createFetcher(
        createFetchableType(
            "Employee", 
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
                    name: "department", 
                    targetTypeName: "Department"
                }
            ]
        ), 
        undefined
    )
;

export const employee$$ = 
    employee$
        .id
        .name
;
