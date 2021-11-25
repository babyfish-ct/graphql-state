# What is the value of this framework and why it was created?

The purpose of this framework is to provide far intelligent services than Apollo client and Relay.

How to consume GraphQL services in React can be divided into four levels

## 1. The first level, provides API to communicate with server
This level of framework is represented by [https://github.com/prisma-labs/graphql-request](https://github.com/prisma-labs/graphql-request).

This kind of framework is the most basic and simplest GraphQL client, which can use its API to communicate with the server, but it does not have any caching services.

When your application is very simple, the minimal function can bring the lowest learning difficulty and use cost. When the project is very simple so that each page is an island of information with a small amount of data, and you can deal with the lack of no cache through frequent refresh queries.

However, when you encounter a slightly more complex application, a variety of different data are presented on UI at the same time, and there are relationships and dependencies between them, you will start to be powerless, because you can't ignore performance issues and refresh all data frequently. You desperately need caching.

## 2. The second level, simple key/value cache

This level of framework is represented by [https://github.com/tannerlinsley/react-query](https://github.com/tannerlinsley/react-query).

It is true that react-query is very powerful in terms of configurability; but the biggest problem is that the cache is a simple key/value cache. In fact, the real data model is a graph structure, and different objects are related to each other. E.g
```
BookStore <--1:n--> Book <--m:n--> Author
```
According to the associations in the example, a simple key/value cache will easily lead to the following two cache items

Cache data 1:
```js
{
  __typename: "BookStore",
  id: 1,
  name: "O'REILLY",
  books: [
     {
         __typename: "Book",
         id: 2,
         name: "Learning GraphQL",
     },
     {
         __typename: "Book",
         id: 3,
         name: "Effective TypeScript"
     }
  ]
}
```
Cached data 2:
```js
{
  __typename: "Author",
  id: 9,
  name: "Alex Banks",
  books: [
     {
         __typename: "Book",
         id: 2,
         name: "Learning GraphQL",
     }
  ]
}
```
In the above data, the book named "Learning GraphQL" exists in both the cache items. This redundancy will cause data inconsistency in subsequent data changes.

As the relationship between objects becomes more and more complex, you will find it more and more difficult to eliminate the side effects of redundancy. You urgently need to normalize the data in the cache, just as you do in RDBMS.

## 3. The third level, normalized-cache

This level of framework is represented by Apollo Client and Relay.

- Apollo Client: [https://github.com/apollographql/apollo-client](https://github.com/apollographql/apollo-client) (normalized cache is supported since 3.0, older versions are not supported)
- Relay: [https://github.com/facebook/relay](https://github.com/facebook/relay)

Normalized-cache stores data rows and the relationships between them just like RDBMS. Highly normalized data has no redundancy. Of course, this kind of internal relational data needs to be converted with the hierarchical data used by the user. Fortunately, the framework can easily black-box this conversion automatically, and users cannot perceive the existence of internal relational data.

Now, users don’t need to worry about data redundancy in the cache. But there is also a serious problem, that is, the mutation operation will be very complicated, developers need to maintain the consistency of the cache.

For example, the data in the existing cache is as follows
```js
{
    "Query": {
        findBooks({"name": "e"}): [{ref: "Book:2"}, {ref: "Book:3"}],
        findBooks({"name": "g"}): [{ref: "Book:2"}]
    },
    "Book:2": {
        id: 2,
        name: "Learning GraphQL"
    },
    "Book:3": {
        id: 3,
        name: "Effective TypeScript"
    }
}
```
Among them, *findBooks({"name": ...})* represents the query condition, and performs fuzzy matching and filtering on the name of the book.

Now, mutate the data, change *{id:2, name: "Learning GraphQL"}* to *{id:2, name: "Learning TypeScript"}*. After mutation, the new name *"Learning TypeScript"* no longer matches the query condition *{name: "g"}*. So, the new cache should look like this
```js
{
    "Query": {
        findBooks({"name": "e"}): [{ref: "Book:3"}, {ref: "Book:3"}],

        // Extra mutation: old data references need to disappear
        findBooks({"name": "g"}): [] 
    },
    "Book:2": {
        id: 2,

        // Main mutation: the original intention of the developer
        name: "Learning TypeScript" 
    },
    "Book:3": {
        id: 3,
        name: "Effective TypeScript"
    }
}
```
> The "main mutation" above is very simple, and this is the developer's intention in itself. However, "extra mutation" is very troublesome. It is the changes that other existing data in the cache have to make in order to adapt to the new data mutation.
> 
> The number of such "extra mutations" is affected by the amount of existing data in the cache and the complexity of the data structure. From a theoretical level, the complexity cannot be limited, and one main mutation can lead to countless extra mutations.

To allow the cache to complete the above "extra mutations", there are nothing more than two ways.

1. Manually change the local cache, which is a high-performance but not necessarily feasible method
2. Let the query *Query.findBooks({name: "g"})* refetch latest data from the server again. This is a low-performance but always feasible method

- For Apollo Client:
  - Modify the cache: [https://www.apollographql.com/docs/react/data/mutations/#updating-the-cache-directly](https://www.apollographql.com/docs/react/data/mutations/#updating-the-cache-directly)
 - Refetch: [https://www.apollographql.com/docs/react/data/mutations/#refetching-queries](https://www.apollographql.com/docs/react/data/mutations/#refetching-queries)

- Relay prefers to modify the cache directly: [https://relay.dev/docs/guided-tour/updating-data/graphql-mutations/#updater-functions](https://relay.dev/docs/guided-tour/updating-data/graphql-mutations/#updater-functions)

As explained above, the complexity of this "extra mutations" cannot be limited. It is foreseeable that if there are more UI modules, the data types inside the modules are richer, and the relationship between data types is more complex, then it will be more difficult to ensure cache consistency.

- If you choose to modify the cache directly, the logic of the code you need to write will become more and more complex.
- If you choose to let affected queries to refetch data again, it is also difficult to determine which queries will be affected by the current mutation.

In short
> One main mutation causes **N** extra mutations
The more complex the UI, the greater the N, this is the biggest problem of Apollo client and relay. If you use them, you will find that the pain point you face has become cache consistency maintenance, and the degree of pain is positively related to the complexity of the UI.

## 4. The fourth level, automatically guarantees cache consistency

This framework can automatically ensure the consistency of the cache after mutation, user only need to save the main mutation into the cache, all the extra mutations will be handled automatically.

The method of directly modifying the cache is preferred, and if not feasible, it will be upgraded to a re-query. No matter how the framework chooses, everything is automatic.
