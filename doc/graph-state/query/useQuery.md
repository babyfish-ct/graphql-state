# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../../README.md)/[Graph state](../README.md)/[Query](./README.md)/useQuery

## 1. Basic usage

```ts
import { FC, memo } from 'react';
import { query$, bookStore$$ } from './__generated/fetchers';
import { useQuery } from 'graphql-state';

export const BookStoreList:FC = memo(() => {

    const data = useQuery(
        query$.findBookStores(
            bookStore$$
        )
    );
    
    return (
        <ul>
            {data.findBookStores.map(store =>
                <li key={store.id}>{store.name}</li>
            )}
        </ul>
    );
});
```
> Note 
>
> The code in this example requires external React components to use &lt;Suspense/&gt;

## 2. Parameters
useQuery is defined as follows
```ts
useQuery<
    T, 
    TVariables
    TAsyncStyle extends "suspense" | "suspense-refetch" | "async-object" = "suspense"
>(
    fetcher: ObjectFetcher<"Query", T, TVariables>,
    options?: {
        mode?: "cache-and-network" | "cache-only",
        variables?: TVariables,
        asyncStyle?: TAsyncStyle
    }
);
```
1. The first parameter is the Fetcher of [graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client), and its root type must be "Query"
3. The second parameter "options" is optional, it's a JSON object containing the following fields
  - variables: Optional, a JOSN object, representing query parameters
  - mode: Optional, there are two choices, default "cache-and-network"
    1. "cache-and-network": First try to query the data from the cache, if the cached data is incomplete, query the data from the server and update the cache
    2. "cache-only": Only query data from the cache, if the cached data is incomplete, throw an exception
  - asyncStyle: Optional, default "suspense"
    1. "suspense": Discuss later
    2. "suspense-refetch": Discuss later
    3. "async-object": Discuss later
    
```ts
import { FC, ChangeEvent, memo, useState, useCallback } from 'react';
import { query$, bookStore$$ } from './__generated';
import { useQuery } from 'graphql-state';

export const BookStoreList:FC = memo(() => {

    const [name, setName] = useState("");
    
    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    }, []);
    
    const data = useQuery(
        query$.findBookStores(
            bookStore$$
        ),
        { 
            variables: { name } 
        }
    );
    
    return (
        <>
            <input value={name} onChange={onNameChange} placeholder="Input name to filter rows..."/>
            <ul>
                {data.findBookStores.map(store =>
                    <li key={store.id}>{store.name}</li>
                )}
            </ul>
        </>
    );
});
```
> Note 
>
> The code in this example requires external React components to use &lt;Suspense/&gt;

## 3. Return type

**With the different values of "options.asyncStyle", the return type of useQuery is also different**

Its behavior is exactly the same as the "useStateValue" discussed in [AsyncValue](../../simple-state/async.md). I will not repeat the discussion here, but only give the correspondence between asyncStyle and the return type (assuming the Fetcher parameter return type is T)

- suspense:
  - Return Type: T
  - Remark: External React components need to use&lt;Suspense/&gt;
  
- suspense-refetch:
  - Return Type: 
    ```
    {
        readonly data: T,
        readonly refetch: () => void
    }
    ```
  - Remark: External React components need to use&lt;Suspense/&gt;
  
- async-object:
  - Return Type: 
    ```
    {
        readonly data?: T,
        readonly loading: boolean,
        readonly error: any,
        readonly refetch: () => void
    }
    ```
  - Remark: "data" can be undefined, when "loading" is true or "error" exists, "data" must be undefined
  
Here takes "async-object" as an example to show the query that can be refreshed

```ts
import { FC, memo } from 'react';
import { query$, bookStore$$ } from './__generated/fetchers';
import { useQuery } from 'graphql-state';

export const BookStoreList:FC = memo(() => {

    const {data, loading, refetch } = useQuery(
        query$.findBookStores(
            bookStore$$
        ),
        {
            asyncStyle: "async-object"
        }
    );
    
    return (
        <>
            {loading && <div>Loading...</div>}
            {
                data &&
                <>
                    <ul>
                        {data.findBookStores.map(store =>
                            <li key={store.id}>{store.name}</li>
                        )}
                    </ul>
                    <button onClick={refetch}>Refresh</button>
                </>
            }
        </>
    );
});
```
When the user clicks the refresh button, the query will be executed again.

"async-object" requires users to handle the loading state by themselves, but does not require any external components

----------------------------

[Back to parent: Query](./README.md) | [Next: usePaginationQuery >](./usePaginationQuery.md)
