import {ImplementationType} from '../CommonTypes';
import {QueryFlatType} from '../fetchers/QueryFetcher';


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
    TFieldName
;

export type QueryEntityFields = 
    "bookStores" | 
    "books" | 
    "authors"
;
