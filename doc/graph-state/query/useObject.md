# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../../README.md)/[Graph state](../README.md)/[Query](./README.md)/useObject&useObjects

In actual projects, there are two kinds of queries that are very common
- Query an object based on an id
- Query multiple objects based on multiple ids

The framework uses the useObject and useObjects functions to achieve these two functions.

> Note:
>
> 1. Think about it according to the normal mode of thinking. Querying object based on id can easily lead to a large number of fragmented small http requests, which can lead to performance problems.
>
> Don’t worry, the supporting [HTTP optimization](../../http-optimization/README.md) can cope with this situation, fragmented small http requests will be merged into a large batch request
>
> 2. These two functions cannot be imported directly from graphql-state, they need to be imported from the generated code, for example
>
> import {useObject, useObjects} from'./__generated';

The definitions of "useObject" and "useObjects" are as follows
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

## 1. Parameter
- fetcher: 
  Fetcher of [grahql-ts-client](https://github.com/babyfish-ct/graphql-ts-client), the root object type cannot be "Query"
- id/ids: Single id or array for ids
- |options?.objectStyle ?? "required" | id | ids |
  |----|----|----|
  |required| Id type of T | ReadonlyArray&lt;Id type of T&gt; |
  |optional| Id type of T &#124; undefined | ReadonlyArray&lt;Id type of T &#124; undefined &gt; |
- options:
  An optional object containing the following fields
  - mode: The usage of this parameter is the same as [useQuery](./useQuery.md), so I won’t repeat it here
  - asyncStyle: The usage of this parameter is the same as [useQuery](./useQuery.md), so I won’t repeat it here
  - variables: The usage of this parameter is the same as [useQuery](./useQuery.md), so I won’t repeat it here
  - objectStyle: Optional, there are two choices, default "required"
    - required: The object with the specified id must exist, otherwise an exception will be thrown
    - optional: If the object with the specified id does not exist, use undefined as the result
    
## 2. Return Type

The two parameters "options.asyncStyle" and "options.objectStyle" will affect the return type of useObject/useObjects. Here are all situations

Assuming that the type of fetcher query is T

1. Return type of "useObject"

<table>
  <thead>
    <tr>
       <th></th>
       <th>objectStyle: required</th>
       <th>objectStyle: optional</th>
       <th>Remark</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>asyncStyle: suspense</b></td>
      <td>T</td>
      <td>T | undefined</td>
      <td>External components need to use &lt;Suspendse/&gt;</td>
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
      <td>External components need to use &lt;Suspendse/&gt;</td>
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
      <td>If "loading" is true or "error" exists, "data" must be undefined</td>
    </tr>
  </tbody>
</table>

2. Return type of "useObjects"

<table>
  <thead>
    <tr>
       <th></th>
       <th>objectStyle: "required"</th>
       <th>objectStyle: "optional"</th>
       <th>Remark</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>asyncStyle: suspense</b></td>
      <td>ReadonlyArray&lt;T&gt;</td>
      <td>ReadonlyArray&lt;T | undefined&gt;</td>
      <td>External components need to use &lt;Suspendse/&gt;</td>
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
      <td>External components need to use &lt;Suspendse/&gt;</td>
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
      <td>If "loading" is true or "error" exists, "data" must be undefined</td>
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
其中, ID不是强制性的，可以使用其它类型，比如String, Int等。

如果ids参数中某些id无法查找到对象，允许服务端返回的数组长度小于ids参数的长度。

------------------------------
[< Previous: usePaginationQuery](./usePaginationQuery.md) | [Back to parent: 查询](./README.md)
