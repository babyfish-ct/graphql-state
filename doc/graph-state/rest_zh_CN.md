# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/[图状态](./README_zh_CN.md)/访问REST服务

考虑到大量的现有服务端基于REST，本框架支持在客户端将REST服务模拟成GraphQL服务，以GraphQL的语义进行查询，并享受[graphql-ts-client](https://github.com/babyfish-ct/graphql-state)提供的语法糖

> REST映射只针对查询，不针对变更。
> 
> 向REST服务发起数据变更并保证本地缓存的一致性并不复杂，请参见[附带的REST例子](../../example/client/src/graph/rest)

# 1. 生成代码

和访问GraphQL服务一样，需先生成[graphql-ts-client](https://github.com/babyfish-ct/graphql-state)所需的代码。

由于服务端提供的是REST服务，无法描述GraphQL schema结构，你需要定义自己的sdl文件，就如同[example/client/scripts/schema.sdl](../../example/client/scripts/rest/schema.sdl)一样
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
> 
> 所以，你只需要定义Query，不需要定义Mutation

按照[整合graphql-ts-client](./graphql-ts-client_zh_CN.md)章节所阐述的内容生成代码即可，这里不再赘述

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

上面阐述的是根Query对象的映射，其他非根对象也需要映射，比如BookStore.books

非根对象有两种映射方法
1. SimpleLoader
  这种方法简单直观，也最符合REST的基本语义，但是会导致N+1问题
2. BatchLoader
  这种方法稍微复杂点，但可以没有N+1问题
实际项目中，推荐使用BatchLoader

## 3.1 SimpleLoader(有N + 1问题)
假如服务端支持如下路径用于查询BookStore的books
```
/rest/bookStore/{:bookStoreId}/books
```
或
```
/rest/bookStore/{:bookStoreId}/books?name=abc
```

你可以这样映射
```ts
new RESTNetworkBuilder<Schema>(
    "http://localhost:8081/rest/"
    ...
)
.association("BookStore", "books", (url, id, args) => url
    .path("/bookStore")
    .pathVariable(id)
    .path("/books")
    .args(args)
)
...
```
其中id为当前BookStore对象的id，args为BookStore.books关联的查询参数

这种方式很简单。但是存在N+1问题。如果有多个BookStore对象，每一个对象都会使用/rest/bookStore/{id}/books请求获取其books集合

## 3.2 BatchLoader

为了解决SimpleLoader的N+1问题，框架支持BatchLoader，相对于SimpleLoader，它不是那么直观，但是可以解决N+1问题

服务端使用如下方式支持一次行查询多个BookStores的books集合
```
/booksOfStores?bookStoreIds=...
```
或
```
/booksOfStores?bookStoreIds=...&name=abc
```
默认情况下，服务端的返回类型为
```ts
Map<ParentId, Refereance | List | Connection>
```
对这里的例子而言，期待的服务端返回内容如下
```ts
{
    bookStoreId1: [
        {id: "bookId1", name: "bookName1"},
        {id: "bookId2", name: "bookName2"}
    ],
    bookStoreId2: [
        {id: "bookId3", name: "bookName3"},
        {id: "bookId4", name: "bookName4"},
        {id: "bookId5", name: "bookName5"}
    ]
}
```
对此，客户端映射应该如下
```ts
new RESTNetworkBuilder<Schema>(
    "http://localhost:8081/rest/"
    ...
)
.association("BookStore", "books", {
    batchLoader: (url, ids, args) => url
        .path("/booksOfStores")
        .arg("bookStoreIds", ids.join(","))
        .args(args)
})
...
```

上面中例子中，服务端返回的是一个Map。

然而，当以下条件全部满足时
1. 当前关联是一个one-to-many关联
2. 当前关联是返回类型简单的list而非用于分页的connection
3. REST返回子对象数据，且每个子对象都包含父对象的id

比如
```ts
[
    { id: "bookId1", name: "bookName1", storeId: 'bookStoreId1' },
    { id: "bookId2", name: "bookName2", storeId: 'bookStoreId1' },
    { id: "bookId3", name: "bookName3", storeId: 'bookStoreId2' },
    { id: "bookId4", name: "bookName4", storeId: 'bookStoreId2' },
    { id: "bookId5", name: "bookName5", storeId: 'bookStoreId2' }
]
```
服务端可以返回一个Array，而不是Map，但客户端必须指定groupBy属性，例如
```ts
new RESTNetworkBuilder<Schema>(
    "http://localhost:8081/rest/"
    ...
)
.association("BookStore", "books", {
    batchLoader: (url, ids, args) => url
        .path("/booksOfStores")
        .arg("bookStoreIds", ids.join(","))
        .args(args),
    groupBy: "storeId"
})
...
```

BatchLoader一次为多个当前对象查询关联对象，如果当前对象过多，会导致很长的URL，因此支持batchSize设置，比如
```ts
new RESTNetworkBuilder<Schema>(
    "http://localhost:8081/rest/"
    ...
)
.association("BookStore", "books", {
    batchLoader: (url, ids, args) => url
        .path("/booksOfStores")
        .arg("bookStoreIds", ids.join(","))
        .args(args),
    batchSize: 32
})
...
```
这里指定batchSize为32，表示一次HTTP请求最多为32个BookStore对象获取books集合。如果现有100个BookStore对象，就分裂成4个HTTP请求并发执行
- http://localhost:8081/rest/booksOfStores?bookStoreIds=bookStoreId1,bookStoreId2,...,bookStoreId32
- http://localhost:8081/rest/booksOfStores?bookStoreIds=bookStoreId33,bookStoreId34,...,bookStoreId64
- http://localhost:8081/rest/booksOfStores?bookStoreIds=bookStoreId65,bookStoreId66,...,bookStoreId96
- http://localhost:8081/rest/booksOfStores?bookStoreIds=bookStoreId97,bookStoreId98,bookStoreId99,bookStoreId100

如果不指定batchSize，其默认值为
- 如果当前关联是集合（list或connection），默认采用为defaultCollectionBatchSize
- 否则，默认采用defaultBatchSize

其中，defaultBatchSize和defaultCollectionBatchSize可以配置
```ts
new RESTNetworkBuilder<Schema>(
    "http://localhost:8081/rest/"
    ...
)
.defaultBatchSize(100)
.defaultCollectionBatchSize(10)
...
```
- 如果用户不指定defaultBatchSize，默认值为64
- 如果用户不指定defaultCollectionBatchSize，默认值为8

-----------------------------
[< 上一篇：触发器](./trigger_zh_CN.md) | [返回上级：图状态](./README_zh_CN.md)
