# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../../README_zh_CN.md)/[图状态](../README_zh_CN.md)/[查询](./README_zh_CN.md)/useObject&useObjects

在实际项目中，有两种查询非常常见
- 根据一个id查询一个对象
- 根据多个id查询多个对象

框架使用useObject和useObjects函数来实现这两个功能。

> 注意：
>
> 1. 按照普通的思维模式来想，根据id查询对象，很容易导致出现大量碎片化的小请求，进而导致性能问题。
> 
> 别担心，配套[HTTP优化](../../http-optimization/README_zh_CN.md)能应对这种情况，碎片化的小请求都会被合并变成一个大的批量请求
>
> 2. 这两个函数不能直接从graphql-state导入，需要从生成的代码中导入，例如
> 
> import { useObject, useObjects } from './__generated';

useObject和useObjects的定义如下
```ts
useObject<
    T, 
    TVariables
    TAsyncStyle extends "suspense" | "suspense-refetch" | "async-object" = "suspense",
    TObjectStyle extends "required" | "optional" = "required"
>(
    fetcher: ObjectFetcher<...Any type except Query..., T, TVariables>,
    id: ...,
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
    ids: ReadonlyArray<...>
    options?: {
        mode?: "cache-and-network" | "cache-only",
        variables?: TVariables,
        asyncStyle?: TAsyncStyle,
        objectStyle?: TObjectStyle
    }
);
```

## 1. 参数解释
- fetcher: 
  [grahql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)的Fetcher，根对象类型不能为"Query"
- id/ids: 单个id或ids数组
- |options?.objectStyle ?? "required" | id | ids |
  |----|----|----|
  |required| Id type of T | ReadonlyArray&lt;Id type of T&gt; |
  |optional| Id type of T &#124; undefined | ReadonlyArray&lt;Id type of T &#124; undefined &gt; |
- options:
  一个可选对象，包含如下字段
  - mode: 和[useQuery](./useQuery_zh_CN.md)中此参数的用法相同，此处不再赘述
  - asyncStyle: 和[useQuery](./useQuery_zh_CN.md)中此参数的用法相同，此处不再赘述
  - variables: 和[useQuery](./useQuery_zh_CN.md)中此参数的用法相同，此处不再赘述
  - objectStyle: 对象风格，有两种取值，可选，默认required
    - required: 指定id的对象必须存在，否则抛出异常
    - optional: 如果指定指定id的对象不存在，认为对象是undefined
    
## 2. 返回类型

options.asyncStyle和options.objectStyle这两个参数都会影响useObject/useObjects的返回类型，这里罗列出所有情况

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
      <td><b>asyncStyle: async-object</b></td>
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
      <td><b>asyncStyle: async-object</b></td>
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

## 3. 使用示范

### 3.1 只带id/ids参数
```ts
import { FC, memo } from 'react';
import { useObject, useObjects } from './__generated';
import { book$$ } from './__generated/fetchers';

export const BookReference: FC<{
    readonly id: string
}> = memo(({id}) => {
    const book = useObject(book$$, id);
    return <div>{JSON.stringify(book)}</div>
});

export const BookReferences: FC<{
    readonly ids: ReadonlyArray<string>
}> = memo(({ids}) => {
    const books = useObjects(book$$, ids);
    return (
        <ul>
            {books.map(book => 
                <li key={book.id}>{JSON.stringify(book)}</li>
            )}
        </ul>
    );
});

```

### 3.1 除id/ids外更多的参数
```ts
import { FC, memo } from 'react';
import { ParameterRef } from 'graphql-ts-client';
import { useObject, useObjects } from './__generated';
import { book$$, author$$ } from './__generated/fetchers';

export const BookReference: FC<{
    readonly id: string,
    readonly bookName?: string
}> = memo(({id, bookName}) => {
    const book = useObject(
        book$$
        .authors(
            { name: ParameterRef.of("bookName") },
            author$$
        ), 
        id,
        {
            variables: { bookName }
        }
    );
    return <div>{JSON.stringify(book)}</div>
});

export const BookReferences: FC<{
    readonly ids: ReadonlyArray<string>,
    readonly bookName?: string
}> = memo(({ids, bookName}) => {
    const books = useObjects(
        book$$
        .authors(
            { name: ParameterRef.of("bookName") },
            author$$
        ), 
        ids,
        {
            variables: { bookName }
        }
    );
    return (
        <ul>
            {books.map(book => 
                <li key={book.id}>{JSON.stringify(book)}</li>
            )}
        </ul>
    );
});

```

## 4. 服务端的支持

useObject和useObjects需要服务端的给予支持，服务端需要如下实现

- 所有实体类从一个抽象接口派生
- 支持一个名称为"entities"的查询字段，接受参数typeName和ids，返回抽象接口的数组

公共接口的名称可以随便取，比如Any, Node, Entity, Object等等。这里我们以Any作为抽象接口的名称给出示范。服务端的行为应该让其sdl看起来类似如此

```
interface Any {
    id: ID!
}
type Query {
    entities(typeName: String!, ids: [ID]!): [Any!]!
    ...
}
type BookStore implements Any {...}
type Book implements Any {...}
type Author implements Any {...}
```
其中, Any和Query中的ID不是强制性的，可以使用其它类型，比如String, Int等。

如果ids参数中某些id无法查找到对象，允许服务端返回的数组长度小于ids参数的长度。

------------------------------
[< 上一篇：usePaginationQuery](./usePaginationQuery_zh_CN.md) | [返回上级：查询](./README_zh_CN.md)
