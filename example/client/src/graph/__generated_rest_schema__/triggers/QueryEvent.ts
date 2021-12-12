import {ImplementationType} from '../CommonTypes';
import {QueryArgs, QueryFlatType} from '../fetchers/QueryFetcher';


export interface QueryEvictEvent {

    readonly eventType: "evict";

    readonly typeName: ImplementationType<"Query">;

    readonly causedByGC: boolean;

    readonly evictedType: "row" | "fields";

    readonly evictedKeys: ReadonlyArray<QueryEntityKey<any>>;

    has(evictedKey: QueryEntityKey<any>): boolean;

    evictedValue<TFieldName extends QueryEntityFields>(
        key: QueryEntityKey<TFieldName>
    ): QueryFlatType[TFieldName] | undefined;
}

export interface QueryChangeEvent {

    readonly eventType: "change";

    readonly typeName: ImplementationType<"Query">;

    readonly changedKeys: ReadonlyArray<QueryEntityKey<any>>;

    has(changedKey: QueryEntityKey<any>): boolean;

    oldValue<TFieldName extends QueryEntityFields>(
        key: QueryEntityKey<TFieldName>
    ): QueryFlatType[TFieldName] | undefined;

    newValue<TFieldName extends QueryEntityFields>(
        key: QueryEntityKey<TFieldName>
    ): QueryFlatType[TFieldName] | undefined;
}

export type QueryEntityKey<TFieldName extends QueryEntityFields> = 
    TFieldName extends "findBookStores" ? 
    { readonly name: "findBookStores"; readonly variables: QueryArgs } : 
    TFieldName extends "findBooks" ? 
    { readonly name: "findBooks"; readonly variables: QueryArgs } : 
    TFieldName extends "findAuthors" ? 
    { readonly name: "findAuthors"; readonly variables: QueryArgs } : 
    TFieldName
;

export type QueryEntityFields = 
    "findBookStores" | 
    "findBooks" | 
    "findAuthors"
;
