# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[Graph state](./README.md)/Access REST service

Considering that a large number of existing servers are based on REST, this framework supports simulating REST services into GraphQL services on the client side, querying with GraphQL semantics, and enjoying syntactic sugar provided by [graphql-ts-client](https://github.com/babyfish-ct/graphql-state)

> REST mapping is only for "Query", not for "Mutation".
> 
> It is not complicated to send mutation to the REST server and ensure the consistency of the local cache, please refer to [Attached REST example](../../example/client/src/graph/rest)

# 1. Generate code

Just like accessing the GraphQL service, you need to generate the code required for [graphql-ts-client](https://github.com/babyfish-ct/graphql-state)

Since the server provides REST services and cannot describe the GraphQL schema structure, you need to define your own sdl file, just like[example/client/scripts/schema.sdl](../../example/client/scripts/rest/schema.sdl)
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
> As mentioned earlier, REST mapping is only for Query, because it is not complicated to send mutation to the REST server and ensure the consistency of the local cache
>
> So, you only need to define "Query", not "Mutation"

Generate the code according to the content described in the [Integrate graphql-ts-client](./graphql-ts-client.md) chapter, so I won’t repeat it here.

# 2. "Query" root object mapping

If the server supports the following REST services for BookStore query
```
/rest/bookStores
```
or
```
/rest/bookStores?name=abc
```
Then you can map it to GraphQL's "Query.findBookStores" field in the process of creating StateManager
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
Among them,
```
url.path("/bookStores").args(args)
```
can also be written as
```
url.path("/bookStores").arg("name", args.name)
```

In addition to "rootAssociation", you can also use "rootScalar" to map non-associated fields. The usage is the same, so I won’t go into details here.

# 3. Non-root object mapping

The above is the mapping of the root "Query" object, other non-root objects also need to be mapped, such as "BookStore.books"

There are two mapping methods for non-root objects

1. SimpleLoader
  This method is simple and intuitive, and is most in line with the basic semantics of REST, but it will cause "N + 1" problems
2. BatchLoader
  This method is a bit more complicated, but it solves the "N+1" problem
  
In actual projects, it is recommended to use BatchLoader

## 3.1 SimpleLoader(There are "N + 1" problems)
If the server supports the following path to query the books of the "BookStore"
```
/rest/bookStore/{:bookStoreId}/books
```
or
```
/rest/bookStore/{:bookStoreId}/books?name=abc
```

You can map it like this
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
Where "id" is the id of the current BookStore object, and "args" is the query parameter of the association "BookStore.books"

This way is very simple. But there is the "N + 1" problem. If there are multiple "BookStore" objects, each object will use "/rest/bookStore/{id}/books" to query its books collection

## 3.2 BatchLoader

In order to solve the "N + 1" problem of SimpleLoader, the framework supports BatchLoader. Compared with SimpleLoader, it is not so intuitive, but it can solve the "N + 1" problem.

The server uses the following path to support querying the books collection of multiple "BookStore" objects at a time
```
/booksOfStores?bookStoreIds=...
```
or
```
/booksOfStores?bookStoreIds=...&name=abc
```
By default, the return type of the server is
```ts
Map<ParentId, Refereance | List | Connection>
```
For the example here, the expected content returned by the server is as follows
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
For this, the client mapping should be as follows
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

In the above example, the server returns a Map.

However, when all the following conditions are met
1. The current association is a one-to-many association
2. The current association is a simple list rather than a connection for paging
3. REST returns an array of child object types, where each child object contains the id of the parent object

for example
```ts
[
    { id: "bookId1", name: "bookName1", storeId: 'bookStoreId1' },
    { id: "bookId2", name: "bookName2", storeId: 'bookStoreId1' },
    { id: "bookId3", name: "bookName3", storeId: 'bookStoreId2' },
    { id: "bookId4", name: "bookName4", storeId: 'bookStoreId2' },
    { id: "bookId5", name: "bookName5", storeId: 'bookStoreId2' }
]
```
The server can return an array instead of a map, but the client must specify the "groupBy" configuration, for example
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
BatchLoader queries associated objects for multiple current objects at once. If there are too many current objects, it will result in a very long URL, so it supports "batchSize" settings, such as
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
The "batchSize" specified here is 32, which means that an HTTP request can obtain a collection of books for up to 32 BookStore objects. If there are 100 "BookStore" objects, it will be split into 4 HTTP requests for concurrent execution
- http://localhost:8081/rest/booksOfStores?bookStoreIds=bookStoreId1,bookStoreId2,...,bookStoreId32
- http://localhost:8081/rest/booksOfStores?bookStoreIds=bookStoreId33,bookStoreId34,...,bookStoreId64
- http://localhost:8081/rest/booksOfStores?bookStoreIds=bookStoreId65,bookStoreId66,...,bookStoreId96
- http://localhost:8081/rest/booksOfStores?bookStoreIds=bookStoreId97,bookStoreId98,bookStoreId99,bookStoreId100

If "batchSize" is not specified, its default value is
- If the current association is a collection(list or connection), "defaultCollectionBatchSize" is used by default
- Otherwise, "defaultBatchSize" is used by default

Among them, "defaultBatchSize" and "defaultCollectionBatchSize" can be configured
```ts
new RESTNetworkBuilder<Schema>(
    "http://localhost:8081/rest/"
    ...
)
.defaultBatchSize(100)
.defaultCollectionBatchSize(10)
...
```
- If the user does not specify "defaultBatchSize", the default value is 64
- If the user does not specify "defaultCollectionBatchSize", the default value is 8

-----------------------------
[< Previous：Trigger](./trigger.md) | [Back to parent：Graph state](./README.md)
