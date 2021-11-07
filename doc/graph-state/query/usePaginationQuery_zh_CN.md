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
  - mode: 和useQuery中此参数的用法相同，此处不再赘述
  - asyncStyle: 和useQuery中此参数的用法相同，此处不再赘述
  - variables: 和useQuery中此参数的用法相同，此处不再赘述
    > 注意：
    > 
    > 不能指定分页参数first, after, last, before；否则，抛出异常
  - windowId: 指定一个标识名称
    > 任何界面都可以使用usePaginationQuery, 都会得到相应的分页结果
    > 对于不同的分页结果，如果以下条件全部满足
    > - 所属对象（包含根对象Query）相同
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
    - forward: 被显示行可以可累积的，由前到后逐段加载的分页
    - backward: 被显示行可以可累积的，由后到前逐段加载的分页
    - page: 经典的，显示行业固定，能前后自由导航的分页

# 2. 返回类型

    
