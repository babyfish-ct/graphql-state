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

## 3. Usage

### 3.1 Only with id/ids parameters
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

### 3.1 More parameters besides id/ids
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

## 4. Server support

"useObject" and "useObjects" need to be supported by the server, and the server needs to be implemented as follows

- All entity classes are derived from an abstract interface
- Support a query field named "entities", accept parameters "typeName" and "ids", and return an array of abstract interfaces

The name of the abstract interface can be taken whatever you want, such as "Any", "Node", "Entity", "Object", etc. Here we use Any as the name of the abstract interface to give an example. The behavior of the server should make its sdl look like this

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
Among them, "ID" is not mandatory, other types can be used too, such as String, Int, etc.

If some ids in the "ids" parameter cannot be found, the length of the array returned by the server is allowed to be less than the length of the "ids" parameter.

------------------------------
[< Previous: usePaginationQuery](./usePaginationQuery.md) | [Back to parent: Query](./README.md)
