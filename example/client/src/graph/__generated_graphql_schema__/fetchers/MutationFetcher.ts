import type { AcceptableVariables, UnresolvedVariables, FieldOptions, DirectiveArgs } from 'graphql-ts-client-api';
import { ObjectFetcher, createFetcher, createFetchableType } from 'graphql-ts-client-api';
import {BookStoreInput} from '../inputs';
import {BookInput} from '../inputs';
import {AuthorInput} from '../inputs';

/*
 * Any instance of this interface is immutable,
 * all the properties and functions can only be used to create new instances,
 * they cannot modify the current instance.
 * 
 * So any instance of this interface is reuseable.
 */
export interface MutationFetcher<T extends object, TVariables extends object> extends ObjectFetcher<'Mutation', T, TVariables> {


    directive(name: string, args?: DirectiveArgs): MutationFetcher<T, TVariables>;


    mergeBookStore<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "mergeBookStore", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'BookStore', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"mergeBookStore", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): MutationFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & MutationArgs["mergeBookStore"] & XDirectiveVariables
    >;

    mergeBookStore<
        XArgs extends AcceptableVariables<MutationArgs['mergeBookStore']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "mergeBookStore", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ObjectFetcher<'BookStore', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"mergeBookStore", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): MutationFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, MutationArgs['mergeBookStore']> & XDirectiveVariables
    >;


    deleteBookStore<
        XAlias extends string = "deleteBookStore", 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer?: (
            options: FieldOptions<"deleteBookStore", {}, {}>
        ) => FieldOptions<XAlias, {readonly [key: string]: DirectiveArgs}, XDirectiveVariables>
    ): MutationFetcher<
        T & {readonly [key in XAlias]?: string}, 
        TVariables & MutationArgs["deleteBookStore"] & XDirectiveVariables
    >;

    deleteBookStore<
        XArgs extends AcceptableVariables<MutationArgs['deleteBookStore']>, 
        XAlias extends string = "deleteBookStore", 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        optionsConfigurer?: (
            options: FieldOptions<"deleteBookStore", {}, {}>
        ) => FieldOptions<XAlias, {readonly [key: string]: DirectiveArgs}, XDirectiveVariables>
    ): MutationFetcher<
        T & {readonly [key in XAlias]?: string}, 
        TVariables & UnresolvedVariables<XArgs, MutationArgs['deleteBookStore']> & XDirectiveVariables
    >;


    mergeBook<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "mergeBook", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'Book', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"mergeBook", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): MutationFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & MutationArgs["mergeBook"] & XDirectiveVariables
    >;

    mergeBook<
        XArgs extends AcceptableVariables<MutationArgs['mergeBook']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "mergeBook", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ObjectFetcher<'Book', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"mergeBook", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): MutationFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, MutationArgs['mergeBook']> & XDirectiveVariables
    >;


    deleteBook<
        XAlias extends string = "deleteBook", 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer?: (
            options: FieldOptions<"deleteBook", {}, {}>
        ) => FieldOptions<XAlias, {readonly [key: string]: DirectiveArgs}, XDirectiveVariables>
    ): MutationFetcher<
        T & {readonly [key in XAlias]?: string}, 
        TVariables & MutationArgs["deleteBook"] & XDirectiveVariables
    >;

    deleteBook<
        XArgs extends AcceptableVariables<MutationArgs['deleteBook']>, 
        XAlias extends string = "deleteBook", 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        optionsConfigurer?: (
            options: FieldOptions<"deleteBook", {}, {}>
        ) => FieldOptions<XAlias, {readonly [key: string]: DirectiveArgs}, XDirectiveVariables>
    ): MutationFetcher<
        T & {readonly [key in XAlias]?: string}, 
        TVariables & UnresolvedVariables<XArgs, MutationArgs['deleteBook']> & XDirectiveVariables
    >;


    mergeAuthor<
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "mergeAuthor", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        child: ObjectFetcher<'Author', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"mergeAuthor", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): MutationFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & MutationArgs["mergeAuthor"] & XDirectiveVariables
    >;

    mergeAuthor<
        XArgs extends AcceptableVariables<MutationArgs['mergeAuthor']>, 
        X extends object, 
        XVariables extends object, 
        XAlias extends string = "mergeAuthor", 
        XDirectives extends { readonly [key: string]: DirectiveArgs } = {}, 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        child: ObjectFetcher<'Author', X, XVariables>, 
        optionsConfigurer?: (
            options: FieldOptions<"mergeAuthor", {}, {}>
        ) => FieldOptions<XAlias, XDirectives, XDirectiveVariables>
    ): MutationFetcher<
        T & (
            XDirectives extends { readonly include: any } | { readonly skip: any } ? 
                {readonly [key in XAlias]?: X} : 
                {readonly [key in XAlias]: X}
        ), 
        TVariables & XVariables & UnresolvedVariables<XArgs, MutationArgs['mergeAuthor']> & XDirectiveVariables
    >;


    deleteAuthor<
        XAlias extends string = "deleteAuthor", 
        XDirectiveVariables extends object = {}
    >(
        optionsConfigurer?: (
            options: FieldOptions<"deleteAuthor", {}, {}>
        ) => FieldOptions<XAlias, {readonly [key: string]: DirectiveArgs}, XDirectiveVariables>
    ): MutationFetcher<
        T & {readonly [key in XAlias]?: string}, 
        TVariables & MutationArgs["deleteAuthor"] & XDirectiveVariables
    >;

    deleteAuthor<
        XArgs extends AcceptableVariables<MutationArgs['deleteAuthor']>, 
        XAlias extends string = "deleteAuthor", 
        XDirectiveVariables extends object = {}
    >(
        args: XArgs, 
        optionsConfigurer?: (
            options: FieldOptions<"deleteAuthor", {}, {}>
        ) => FieldOptions<XAlias, {readonly [key: string]: DirectiveArgs}, XDirectiveVariables>
    ): MutationFetcher<
        T & {readonly [key in XAlias]?: string}, 
        TVariables & UnresolvedVariables<XArgs, MutationArgs['deleteAuthor']> & XDirectiveVariables
    >;
}

export const mutation$: MutationFetcher<{}, {}> = 
    createFetcher(
        createFetchableType(
            "Mutation", 
            "EMBEDDED", 
            [], 
            [
                {
                    category: "REFERENCE", 
                    name: "mergeBookStore", 
                    argGraphQLTypeMap: {input: 'BookStoreInput!'}, 
                    targetTypeName: "BookStore"
                }, 
                {
                    category: "SCALAR", 
                    name: "deleteBookStore", 
                    argGraphQLTypeMap: {id: 'String!'}, 
                    undefinable: true
                }, 
                {
                    category: "REFERENCE", 
                    name: "mergeBook", 
                    argGraphQLTypeMap: {input: 'BookInput!'}, 
                    targetTypeName: "Book"
                }, 
                {
                    category: "SCALAR", 
                    name: "deleteBook", 
                    argGraphQLTypeMap: {id: 'String!'}, 
                    undefinable: true
                }, 
                {
                    category: "REFERENCE", 
                    name: "mergeAuthor", 
                    argGraphQLTypeMap: {input: 'AuthorInput!'}, 
                    targetTypeName: "Author"
                }, 
                {
                    category: "SCALAR", 
                    name: "deleteAuthor", 
                    argGraphQLTypeMap: {id: 'String!'}, 
                    undefinable: true
                }
            ]
        ), 
        undefined
    )
;

export interface MutationArgs {

    readonly mergeBookStore: {
        readonly input: BookStoreInput
    }, 

    readonly deleteBookStore: {
        readonly id: string
    }, 

    readonly mergeBook: {
        readonly input: BookInput
    }, 

    readonly deleteBook: {
        readonly id: string
    }, 

    readonly mergeAuthor: {
        readonly input: AuthorInput
    }, 

    readonly deleteAuthor: {
        readonly id: string
    }
}