# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/图状态(./README_zh_CN.md)/访问REST服务

考虑到大量的现有服务端基于REST，本框架支持在客户端REST服务模拟成GraphQL服务，以GraphQL的语义进行查询，并享受[graphql-ts-client](https://github.com/babyfish-ct/graphql-state)的语法糖

> REST映射只支队查询，不针对变更。
> 
> 如果向REST服务发起数据变更并保证本地缓存的一致性并不复杂，请参见[附带的REST例子](../../example/client/src/graph/rest)

# 1. 生成代码

和访问GraphQL服务一样，需先生成[graphql-ts-client](https://github.com/babyfish-ct/graphql-state)所需的代码。

由于和服务端不提供GraphQL服务，无法描述schema结构，你需要定义自己的sdl文件，就如同[example/client/scripts/](../../example/client/scripts/rest/schema.sdl)一样
```
type BookStore {
    id: ID!
    name: String!
    books(name: String): [Book!]!
}

type Book {
    id: ID!
    name: String!
    store: BookStore
    authors(name: String): [Author!]!
}

type Author {
    id: ID!
    name: String!
    books(name: String): [Book!]!
}

type Query {

    findBookStores(name: String): [BookStore!]!
    
    findBooks(
        name: String,
        first: Int,
        after: String,
        last: Int,
        before: String
    ): BookConnection!
    
    findAuthors(
        name: String,
        first: Int,
        after: String,
        last: Int,
        before: String
    ): AuthorConnection!
}

type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String!
    endCursor: String!
}

type BookConnection {
    totalCount: Int!,
    edges: [BookEdge!]!
    pageInfo: PageInfo!
}

type BookEdge {
    node: Book!
    cursor: String!
}

type AuthorConnection {
    totalCount: Int!,
    edges: [AuthorEdge!]!
    pageInfo: PageInfo!
}

type AuthorEdge {
    node: Author!
    cursor: String!
}
```
> 前文提过，REST映射只针对查询，因为向REST服务发起数据变更并保证本地缓存的一致性并不复杂
> 所以，你住需要定义Query，不需要定义Mutation

按照[整合graphql-ts-client](./graphql-ts-client_zh_CN.md)章节所介绍的内容生成代码，这里不再赘述

# 2. Query根对象映射

假如服务端支持如下REST服务用于BookStore的查询
```
/rest/bookStores
```
或
```
/rest/bookStores?name=abc
```
那么你可以在创建StateManager的过程中，将之映射为GraphQL的Query.findBookStore字段
```ts
import { StateManager, RESTNetworkBuilder } form 'graphql-state';
import { Schema, newTypedConfiguration } from './__generated';

function createStateManager(): StateManager<Schema> {
    return newTypedConfiguration()
        .networkBuilder(
            new RESTNetworkBuilder<Schema>(
                "http://localhost:8081/rest/",
                async url => {
                    const response = await fetch(url); 
                    return response.json(),
                }
            )
            .rootAssociation("findBookStore", (url, args) => url.path("/bookStores").args(args))
        )
}
```
其中
```
url.path("/bookStores").args(args)
```
也可以写作
```
url.path("/bookStores").arg("name", args.name)
```

除了rootAssociation外，你还可以使用rootScalar对非关联字段进行映射，用法一样，这里不再赘述

# 3. 非根对象映射

上面阐述的是根Query对象的映射，其他非根不对象也需要映射，比如BookStore.books

非根对象有两种映射方法
1. SimpleLoader
  这种方法简单直观，也最符合REST的基本语义，但是会导致N+1问题
2. BatchLoader
  这种方法稍微复杂点，但可以没有N+1问题
实际项目中，推荐使用BatchLoader

## 3.1 SimpleLoader(有N + 1问题)

## 3.2 BatchLoader


上面阐述的是根Query对象的映射，其他非根不对象也需要映射，比如BookStore.booksg

-----------------------------
[< 上一篇：触发器](./trigger_zh_CN.md) | [返回上级：图状态](./README_zh_CN.md)
