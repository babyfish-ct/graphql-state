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
export interface DepartmentFetcher<T extends object, TVariables extends object> extends ObjectFetcher<'Department', T, TVariables> {

    on<XName extends ImplementationType<'Department'>, X extends object, XVariables extends object>(
        child: ObjectFetcher<XName, X, XVariables>, 
        fragmentName?: string // undefined: inline fragment; otherwise, otherwise, real fragment
    ): DepartmentFetcher<
        XName extends 'Department' ?
        T & X :
        WithTypeName<T, ImplementationType<'Department'>> & (
            WithTypeName<X, ImplementationType<XName>> | 
            {__typename: Exclude<ImplementationType<'Department'>, ImplementationType<XName>>}
        ), 
        TVariables & XVariables
    >;


    directive(name: string, args?: DirectiveArgs): DepartmentFetcher<T, TVariables>;


    readonly __typename: DepartmentFetcher<T & {__typename: ImplementationType<'Department'>}, TVariables>;


    readonly id: DepartmentFetcher<T & {readonly "id": string}, TVariables>;

    "id+"<
        XAlias extends string = "id", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer?: (
            options: FieldOptions<"id", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): DepartmentFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~id": DepartmentFetcher<Omit<T, 'id'>, TVariables>;


    readonly name: DepartmentFetcher<T & {readonly "name": string}, TVariables>;

    "name+"<
        XAlias extends string = "name", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer?: (
            options: FieldOptions<"name", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): DepartmentFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: string} : 
                {readonly [key in XAlias]: string}
        ), 
        TVariables & XDirectiveVariables
    >;

    readonly "~name": DepartmentFetcher<Omit<T, 'name'>, TVariables>;


    employees<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "employees", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'Employee', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"employees", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): DepartmentFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & DepartmentArgs["employees"] & XDirectiveVariables
    >;

    employees<
        XArgs extends AcceptableVariables<DepartmentArgs['employees']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "employees", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ObjectFetcher<'Employee', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"employees", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): DepartmentFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, DepartmentArgs['employees']> & XDirectiveVariables
    >;
}

export const department$: DepartmentFetcher<{}, {}> = 
    createFetcher(
        createFetchableType(
            "Department", 
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
                    name: "employees", 
                    argGraphQLTypeMap: {descending: 'Boolean!'}, 
                    targetTypeName: "Employee"
                }
            ]
        ), 
        undefined
    )
;

export const department$$ = 
    department$
        .id
        .name
;

export interface DepartmentArgs {

    readonly employees: {
        readonly descending: boolean
    }
}