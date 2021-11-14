# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../../README_zh_CN.md)/[图状态](../README_zh_CN.md)/[查询](./README_zh_CN.md)/useQuery

## 1. 基本用法

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
> 注意：
>
> 这种例子的代码需要外部React组件需要使用&lt;Suspense/&gt;

## 2. 参数
useQuery定义如下
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
1. 第一个参数为[graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)的Fetcher，其根类型必须是"Query"
2. 第二个参数options可选，一个JSON对象，包含如下字段
  - variables: 可选，一个JOSN对象，表示查询参数
  - mode: 具备两个取值，可选，默认"cache-and-network"
    1. "cache-and-network": 先尝试从缓存中查询数据，如果缓存数据不全，从服务的查询数据并更新缓存
    2. "cache-only": 只从缓存中查询数据，如果缓存数据不全，抛出异常
  - asyncStyle: 可选，默认"suspense"
    1. "suspense": 稍后讨论
    2. "suspense-refetch": 稍后讨论
    3. "async-object": 稍后讨论
    
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
> 注意：
>
> 这个例子的代码需要外部React组件使用&lt;Suspense/&gt;

## 3. 返回类型

随着options.asyncStyle取值的不同，useQuery的返回值也不相同。

其行为和[AsyncValue](../../simple-state/async_zh_CN.md)中讨论过的useStateValue完全一致，这里不做重复讨论，仅仅给出asyncStyle和返回类型的对应关系（假设Fetcher参数返回类型为T）

- suspense:
  - 返回类型：T
  - 备注：外部React组件需要使用&lt;Suspense/&gt;
- suspense-refetch:
  - 返回类型：
    ```
    {
        readonly data: T,
        readonly refetch: () => void
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
        readonly refetch: () => void
    }
    ```
  - 备注：data可以为undefined，当loading为true或error存在时，data必为undefined
  
这里以async-object为例，展示可以刷新的查询

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
                    <button onClick={refetch}>刷新</button>
                </>
            }
        </>
    );
});
```
当用户点击刷新按钮后，查询会重新执行。

"async-object"需要用户自己处理loading状态，但对外部组件没有任何要求

----------------------------

[返回上级: 查询](./README_zh_CN.md) | [下一篇：usePaginationQuery >](./usePaginationQuery_zh_CN.md)
