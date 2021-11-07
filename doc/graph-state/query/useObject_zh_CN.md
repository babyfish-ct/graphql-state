# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../../README_zh_CN.md)/[图状态](../README_zh_CN.md)/[查询](./README_zh_CN.md)/useObject/useObjects

在实际项目中，有两种查询非常常见
- 根据id查询一个对象
- 根据多个id查询多个对象

框架使用useObject和useObjects函数来实现这两个功能。

> 注意：
>
> 按照普通的思维莫斯来想，根据单个id查询单个对象，很容易导致出现大量碎片化的小请求，进而导致性能问题。
>
> 别担心，配套[HTTP优化](../../http-optimization/README_zh_CN.md)能应对这种情况，碎片化的小请求都会被合并一个大的批量请求

useObject和useObjects的定义如下
```ts
useObject<
    T, 
    TVariables
    TAsyncStyle extends "suspense" | "suspense-refetch" | "async-object" = "suspense",
    TObjectStyle extends "required" | "optional" = "required"
>(
    fetcher: ObjectFetcher<...Any type except Query..., T, TVariables>,
    options?: {
        mode?: "cache-and-network" | "cache-only",
        variables?: TVariables,
        asyncStyle?: TAsyncStyle,
        objectStyle?: TObjectStyle
    }
);

useObjects<
    T, 
    TVariables
    TAsyncStyle extends "suspense" | "suspense-refetch" | "async-object" = "suspense",
    TObjectStyle extends "required" | "optional" = "required"
>(
    fetcher: ObjectFetcher<...Any type except Query..., T, TVariables>,
    options?: {
        mode?: "cache-and-network" | "cache-only",
        variables?: TVariables,
        asyncStyle?: TAsyncStyle,
        objectStyle?: TObjectStyle
    }
);
```
## 1. 参数解释
1. fetcher: 
  [grahql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)的Fetcher，根对象类型必须不能为"Query"
2. options:
  一个可选对象，包含如下字段
  - mode: 和useQuery中此参数的用法相同，此处不再赘述
  - asyncStyle: 和useQuery中此参数的用法相同，此处不再赘述
  - variables: 和useQuery中此参数的用法相同，此处不再赘述
  - objectStyle: 对象风格，有两种取值，可选，默认required
    - required: 指定id的对象必须存在，否则抛出异常
    - optional: 如果指定指定id的对象不存在，认为对象是undefined
    
## 2. 返回类型

假设fetcher查询的类型为T

1. useObject的返回类型为

<table>
  <thead>
    <tr>
       <th></th>
       <th>objectStyle: required</th>
       <th>objectStyle: optional</th>
       <th>备注</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>asyncStyle: suspense</b></td>
      <td>T</td>
      <td>T | undefined</td>
      <td>需要外部组件使用&lt;Suspendse/&gt;</td>
    </tr>
    <tr>
      <td><b>asyncStyle: suspense-refetch</b></td>
      <td><pre>{
    readonly data: T,
    readonly refetch: () => void
}</pre></td>
      <td><pre>{
    readonly data?: T,
    readonly refetch: () => void
}</pre></td>
      <td>需要外部组件使用&lt;Suspendse/&gt;</td>
    </tr>
    <tr>
      <td><b>asyncStyle: async-error</b></td>
      <td><pre>{
    readonly data?: T,
    readonly loading: boolean,
    readonly error: any,
    readonly refetch: () => void
}</pre></td>
      <td><pre>{
    readonly data?: T,
    readonly loading: boolean,
    readonly error: any,
    readonly refetch: () => void
}</pre></td>
      <td>如果loading为true或error存在，data必为undefined</td>
    </tr>
  </tbody>
</table>

2. useObjects的返回类型为

<table>
  <thead>
    <tr>
       <th></th>
       <th>objectStyle: "required"</th>
       <th>objectStyle: "optional"</th>
       <th>备注</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>asyncStyle: suspense</b></td>
      <td>ReadonlyArray&lt;T&gt;</td>
      <td>ReadonlyArray&lt;T | undefined&gt;</td>
      <td>需要外部组件使用&lt;Suspendse/&gt;</td>
    </tr>
    <tr>
      <td><b>asyncStyle: suspense-refetch</b></td>
      <td><pre>{
    readonly data: 
        ReadonlyArray&lt;T&gt;,
    readonly refetch: () => void
}</pre></td>
      <td><pre>{
    readonly data: 
        ReadonlyArray&lt;T | undefined&gt;,
    readonly refetch: () => void
}</pre></td>
      <td>需要外部组件使用&lt;Suspendse/&gt;</td>
    </tr>
    <tr>
      <td><b>asyncStyle: async-error</b></td>
      <td><pre>{
    readonly data?: 
        ReadonlyArray&lt;T&gt;,
    readonly loading: boolean,
    readonly error: any,
    readonly refetch: () => void
}</pre></td>
      <td><pre>{
    readonly data?: 
        ReadonlyArray&lt;T | undefined&gt;,
    readonly loading: boolean,
    readonly error: any,
    readonly refetch: () => void
}</pre></td>
      <td>如果loading为true或error存在，data必为undefined</td>
    </tr>
  </tbody>
</table>

------------------------------
[< 上一篇：usePaginationQuery](./usePaginationQuery_zh_CN.md) | [返回上级：查询](./README_zh_CN.md)
