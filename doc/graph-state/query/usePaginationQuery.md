# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../../README.md)/[Graph state](../README.md)/[Query](./README.md)/usePaginationQuery

usePaginationQuery is used to support pagiatnion query, which is defined as follows

```ts
usePaginationQuery<
    T, 
    TVariables
    TAsyncStyle extends "suspense" | "suspense-refetch" | "async-object" = "suspense"
>(
    fetcher: ObjectFetcher<"Query", T, TVariables>,
    options?: {
        mode?: "cache-and-network" | "cache-only",
        variables?: TVariables,
        asyncStyle?: TAsyncStyle,
        windowId: string,
        initialSize: number,
        pageSize?: number,
        paginationStyle?: "forward" | "backward" | "page"
    }
);
```
## 1. Parameters
1. fetcher: 
  A Fetcher of [grahql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)的Fetcher，the root object type must be "Query"

  > Unlike "useQuery", the fetcher parameter of "usePaginationQuery" must and can only have one connection field, otherwise it will cause an exception.
  >
  > For the connection field, please refer to https://graphql.org/learn/pagination/#complete-connection-model

2. options:
  An optional object containing the following fields
  - variables: The usage of this parameter is the same as [useQuery](./useQuery.md), so I won’t repeat it here
    > Note: 
    > 
    > The pagination variables "first", "after", "last" and "before" cannot be specified; otherwise, an exception will be thrown
  - mode: The usage of this parameter is the same as [useQuery](./useQuery.md), so I won’t repeat it here
  - asyncStyle: The usage of this parameter is the same as [useQuery](./useQuery.md), so I won’t repeat it here
  - windowId: Specify an identifying name
    > "usePaginationQuery" can be used in any UI components, each UI component can get a result.
    >
    > For the results of different UI components, if the following conditions are all met
    >- same windowId
    >- same paginationStyle
    >- same initialSize
    >
    > Then they will share the same data in cache, including page numbers and other temporary state related to pagination.
  - initialSize: Initial number of records
  - pageSize: The number of records to be loaded each time the page is turned. Optional, the default is equal to initialSize
    > Note: 
    >
    > If "paginationStyle" is "page", then "pageSize" is either not specified or equal to "initialSize", otherwise it will cause an exception
  - paginationStyle: there are three values
    - forward: accumulative pagitation by segment loading from front to back
    - backward: accumulative pagitation by segment loading from back to front
    - page: classic pagination, the number of displayed records is fixed, and the page can be freely navigated

## 2. Return Type

With the different values of "options.asyncStyle", the return type of "usePaginationQuery" is also different

Its behavior is exactly the same as the "useStateValue" discussed in [AsyncValue](../../simple-state/async.md). I will not repeat the discussion here, but only give the correspondence between "asyncStyle"

- suspense:
  - Return Type: 
    ```
    {
        readonly data: T,
        
        readonly loadNext: () => void,
        readonly loadPrevious: () => void,
        readonly hasNext: boolean,
        readonly hasPrevious: boolean,
        readonly isLoadingNext: boolean,
        readonly isLoadingPrevious: boolean
    }
    ```
  - Remark: External React components need to use &lt;Suspense/&gt;
- suspense-refetch:
  - Return Type: 
    ```
    {
        readonly data: T,
        readonly refetch: () => void,
        
        readonly loadNext: () => void,
        readonly loadPrevious: () => void,
        readonly hasNext: boolean,
        readonly hasPrevious: boolean,
        readonly isLoadingNext: boolean,
        readonly isLoadingPrevious: boolean
    }
    ```
  - Remark: External React components need to use &lt;Suspense/&gt;
- async-object:
  - Return Type: 
    ```
    {
        readonly data?: T,
        readonly loading: boolean,
        readonly error: any,
        readonly refetch: () => void,
        
        readonly loadNext: () => void,
        readonly loadPrevious: () => void,
        readonly hasNext: boolean,
        readonly hasPrevious: boolean,
        readonly isLoadingNext: boolean,
        readonly isLoadingPrevious: boolean
    }
    ```
  - Remark: "data" can be undefined, when "loading" is true or "error" exists, "data" must be undefined

## 3. Pagination style

there are three choices for "options.paginationStyle"
- forward: accumulative pagitation by segment loading from front to back
- backward: accumulative pagitation by segment loading from back to front
- page: classic pagination, the number of displayed records is fixed, and the page can be freely navigated
    
### 3.1. forward
```ts
import { FC, memo } form 'react';
import { usePaginationQuery } from 'graphql-state';
import { query$, bookConnection$, bookEdge$, book$$ } from './__generated/';

const BookList: FC = memo(() => {

    const { data, loading, loadNext, hasNext, isLoadingNext } = usePaginationQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$
                )
            ),
            options => options.alias("conn")
        ),
        {
            asyncStyle: "async-object",
            
            windowId: "BookList",
            paginationStyle: "forward",
            initialSize: 2
        }
    );
    
    return (
        <>
            { loading && <div>Loading...</div> }
            { 
                data && <>
                    <table>
                        { data.conn.edges.map(edge =>
                            <tr key={edge.node.id}>
                                ... more ui elements ...
                            </tr>
                        ) }
                    </table>
                    <button disabled={!hasNext} onClick={loadNext}>
                        { isLoadingNext ? "Loading...": "Load more" }
                    </button>
                </> 
            }
        </>
    );
});
```

1. After running, the initial UI is as follows
  ```
  +---------------------+
  | row-1               |
  +---------------------+
  | row-2               |
  +---------------------+

  +-----------+
  | Load more |
  +-----------+
  ```
2. Click the "Load more" button, the UI changes to
  ```
  +---------------------+
  | row-1               |
  +---------------------+
  | row-2               |
  +---------------------+

  +--------------+
  | Loading...   |
  +--------------+
  ```
3. After the HTTP request is completed, the UI becomes

  ```
  +---------------------+
  | row-1               |
  +---------------------+
  | row-2               |
  +---------------------+
  | row-3               |
  +---------------------+
  | row-4               |
  +---------------------+

  +-----------+
  | Load more |
  +-----------+
  ```

### 3.2. backward
```ts
import { FC, memo } form 'react';
import { usePaginationQuery } from 'graphql-state';
import { query$, bookConnection$, bookEdge$, book$$ } from './__generated/fetchers';

const BookList: FC = memo(() => {

    const { data, loading, loadPrevious, hasPrevious, isLoadingPrevious } = usePaginationQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$
                )
            ),
            options => options.alias("conn")
        ),
        {
            asyncStyle: "async-object",
            
            windowId: "BookList",
            paginationStyle: "backward",
            initialSize: 2
        }
    );
    
    return (
        <>
            { loading && <div>Loading...</div> }
            { 
                data && <>
                    <button disabled={!hasPrevious} onClick={loadPrevious}>
                        { isLoadingPrevious ? "Loading...": "Load more" }
                    </button>
                    <table>
                        { data.conn.edges.map(edge =>
                            <tr key={edge.node.id}>
                                ... more ui elements ...
                            </tr>
                        ) }
                    </table>
                </> 
            }
        </>
    );
});
```

1. After running, the initial UI is as follows(Assuming a total of 100 records)
  ```
  +-----------+
  | Load more |
  +-----------+
  
  +---------------------+
  | row-99              |
  +---------------------+
  | row-100             |
  +---------------------+
  ```
2. Click the "Load more" button, the UI changes to
  ```
  +--------------+
  | Loading...   |
  +--------------+

  +---------------------+
  | row-99              |
  +---------------------+
  | row-100             |
  +---------------------+
  ```
3. After the HTTP request is completed, the UI becomes

  ```
  +-----------+
  | Load more |
  +-----------+

  +-----------------------+
  | row-97                |
  +-----------------------+
  | row-98                |
  +-----------------------+
  | row-99                |
  +-----------------------+
  | row-100               |
  +-----------------------+

  ```

### 3.3. page
```ts
import { FC, memo } form 'react';
import { usePaginationQuery } from 'graphql-state';
import { query$, bookConnection$, bookEdge$, book$$ } from './__generated/fetchers';

const BookList: FC = memo(() => {

    const { 
        data, 
        loading, 
        
        loadNext, 
        loadPrevious,
        
        hasNext, 
        hasPrevious,
        
        isLoadingNext,
        isLoadingPrevious
    } = usePaginationQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$
                )
            ),
            options => options.alias("conn")
        ),
        {
            asyncStyle: "async-object",
            
            windowId: "BookList",
            paginationStyle: "page",
            initialSize: 2
        }
    );
    
    return (
        <>
            { loading && <div>Loading...</div> }
            { 
                data && <>
                    <table>
                        { data.conn.edges.map(edge =>
                            <tr key={edge.node.id}>
                                ... more ui elements ...
                            </tr>
                        ) }
                    </table>
                    <button disabled={!hasPrevious} onClick={loadPrevious}>
                        { isLoadingPrevious ? "Loading pervious...": "< Previous" }
                    </button>
                    <button disabled={!hasNext} onClick={loadNext}>
                        { isLoadingNext ? "Loading next...": "Next >" }
                    </button>
                </> 
            }
        </>
    );
});
```

1. After running, the initial UI is as follows
  ```
  +---------------------+
  | row-1               |
  +---------------------+
  | row-2               |
  +---------------------+

  +------------+ +--------+
  | < Previous | | Next > |
  +------------+ +--------+
  ```
2. Click the "Next >" button, the UI changes to
  ```
  +---------------------+
  | row-1               |
  +---------------------+
  | row-2               |
  +---------------------+

  +------------+ +-------------------+
  | < Previous | | Loading next...   |
  +------------+ +-------------------+
  ```
3. After the HTTP request is completed, the UI becomes

  ```
  +---------------------+
  | row-3               |
  +---------------------+
  | row-4               |
  +---------------------+

  +------------+ +--------+
  | < Previous | | Next > |
  +------------+ +--------+
  ```

4. Click the "< Previous" button, the UI changes to

  ```
  +---------------------+
  | row-3               |
  +---------------------+
  | row-4               |
  +---------------------+

  +-----------------------+ +--------+
  | Loading previous...   | | Next > |
  +-----------------------+ +--------+
  ```
5. After the HTTP request is completed, the UI becomes
  ```
  +---------------------+
  | row-1               |
  +---------------------+
  | row-2               |
  +---------------------+

  +------------+ +--------+
  | < Previous | | Next > |
  +------------+ +--------+
  ```

-------------

[< Previous: useQuery](./useQuery.md) | [Back to parent: Query](./README.md) | [Next: useObject&useObjects](./useObject.md)
