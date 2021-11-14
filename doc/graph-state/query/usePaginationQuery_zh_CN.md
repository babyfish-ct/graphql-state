# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../../README_zh_CN.md)/[图状态](../README_zh_CN.md)/[查询](./README_zh_CN.md)/usePaginationQuery

usePaginationQuery用于支持分页面查询，其定义如下

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
## 1. 参数解释
1. fetcher: 
  [grahql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)的Fetcher，根对象类型必须为"Query"

  和useQuery不同，usePaginationQuery的fetcher参数必须且只能拥有一个connection分页字段，否则会导致异常。

  > 关于Connection字段，请参考https://graphql.org/learn/pagination/#complete-connection-model

2. options:
  一个可选对象，包含如下字段
  - variables: 和[useQuery](./useQuery_zh_CN.md)中此参数的用法相同，此处不再赘述
    > 注意：
    > 
    > 不能指定分页参数first, after, last, before；否则，抛出异常
  - mode: 和[useQuery](./useQuery_zh_CN.md)中此参数的用法相同，此处不再赘述
  - asyncStyle: 和[useQuery](./useQuery_zh_CN.md)中此参数的用法相同，此处不再赘述
  - windowId: 指定一个标识名称
    > 任何界面都可以使用usePaginationQuery, 都会得到相应的分页结果。
    > 
    > 对于不同的分页结果，如果以下条件全部满足
    > - windowId相同
    > - paginationStyle相同
    > - initialSize相同
    > 
    > 那么它们将会共享相同缓存中同一项数据，包括页码等分页相关的临时状态。
  - initialSize: 初始记录条数
  - pageSize: 每次翻页要加载的记录条数。可选，默认等于initialSize
    > 注意：
    > 
    > 如果paginationStyle为"page"，则pageSize要么不指定，要么等于initialSize，否则会导致异常
  - paginationStyle: 分页方式，有三种取值
    - forward: 可累积的，由前到后逐段加载的分页
    - backward: 可累积的，由后到前逐段加载的分页
    - page: 经典的，记录条数固定，能前后自由导航的分页

## 2. 返回类型

随着options.asyncStyle取值的不同，useQuery的返回值也不相同。

其行为和[AsyncValue](../../simple-state/async_zh_CN.md)中讨论过的useStateValue完全一致，这里不做重复讨论，仅仅给出asyncStyle和返回类型的对应关系（假设Fetcher参数返回类型为T）

- suspense:
  - 返回类型：
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
  - 备注：外部React组件需要使用&lt;Suspense/&gt;
- suspense-refetch:
  - 返回类型：
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
  - 备注：外部React组件需要使用&lt;Suspense/&gt;
- async-object:
  - 返回类型：
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
  - 备注：data可以为undefined，当loading为true或error存在时，data必为undefined

## 3. 分页风格

options.paginationStyle为分页风格分页方式，有三种取值
  - forward: 可累积的，由前到后逐段加载的分页
  - backward: 可累积的，由后到前逐段加载的分页
  - page: 经典的，记录条数固定，能前后自由导航的分页
    
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

1. 运行后，初始界面如下
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
2. 点击"Load more"按钮，界面变为
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
3. HTTP请求返回后，界面变为

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

1. 运行后，初始界面如下(假设总记录100条)
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
2. 点击"Load more"按钮，界面变为
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
3. HTTP请求返回后，界面变为

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

1. 运行后，初始界面如下
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
2. 点击"Next >"按钮，界面变为
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
3. HTTP请求返回后，界面变为

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

4. 点击"< Previous"按钮，界面变为

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
5. HTTP请求返回后，界面变为
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

[< 上一篇：useQuery](./useQuery_zh_CN.md) | [返回上级：查询](./README_zh_CN.md) | [下一篇：useObject&useObjects](./useObject_zh_CN.md)
