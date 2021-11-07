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
