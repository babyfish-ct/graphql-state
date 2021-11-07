# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../../README_zh_CN.md)/[图状态](../README_zh_CN.md)/[查询](./README_zh_CN.md)/useQuer

## 1. 基本用法

```ts
import { FC, memo } from 'react';
import { query$, bookStore$$ } from './__generated';
import { useQuery } from 'graphql-state';

export const BookStoreList:FC = memo(() => {

    const bookStores = useQuery(
        query$.findBookStores(
            bookStore$$
        )
    );
    
    return (
        <ul>
            {bookStores.map(store =>
                <li key={store.id}>{store.name}</li>
            )}
        </ul>
    );
});
```

## 2. 参数
useQuery具备两个参数
1. 第一个参数为[graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)的Fetcher，其根类型必须是"Query"
2. 第二个参数为options，可选，一个JSON对象，包含如下字段
  - mode: 具备两个取值，可选，默认"cache-and-network"
    1. "cache-and-network": 先尝试从缓存中查询数据，如果缓存数据不全，从服务的查询数据并更新缓存
    2. "cache-only": 只从缓存中查询数据，如果缓存数据不全，抛出异常
  - asyncStyle: 可选，默认"suspense"
    1. "suspense": 稍后讨论
    2. "suspense-refetch": 稍后讨论
    3. "async-object": 稍后讨论
  - variables: 可选，一个JOSN对象，表示查询参数
    
```ts
import { FC, ChangeEvent, memo, useState, useCallback } from 'react';
import { query$, bookStore$$ } from './__generated';
import { useQuery } from 'graphql-state';

export const BookStoreList:FC = memo(() => {

    const [name, setName] = useState("");
    
    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    }, []);
    
    const bookStores = useQuery(
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
                {bookStores.map(store =>
                    <li key={store.id}>{store.name}</li>
                )}
            </ul>
        </>
    );
});
```

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
  - 备注：data可以为undefined，当loading为true时，data必为undefined
  
