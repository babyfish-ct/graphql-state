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


    findDepartments<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findDepartments", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'Department', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"findDepartments", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & QueryArgs["findDepartments"] & XDirectiveVariables
    >;

    findDepartments<
        XArgs extends AcceptableVariables<QueryArgs['findDepartments']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "findDepartments", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ObjectFetcher<'Department', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"findDepartments", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): QueryFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: readonly X[]} : 
                {readonly [key in XAlias]: readonly X[]}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, QueryArgs['findDepartments']> & XDirectiveVariables
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
                    name: "findDepartments", 
                    argGraphQLTypeMap: {name: 'String'}, 
                    targetTypeName: "Department"
                }
            ]
        ), 
        undefined
    )
;

export interface QueryArgs {

    readonly findDepartments: {
        readonly name?: string
    }
}