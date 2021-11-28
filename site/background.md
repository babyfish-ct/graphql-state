# What is the value of this framework and why it was created?

## Essence of UI state

**One main mutation causes "N" extra mutations. The more complex the UI, the larger the "N".**

## Why?

Let's image some data like this
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
Among them, *findBooks({"name": ...})* represents the query condition, and performs fuzzy matching and filtering on the name of the books.
- Both the book name *"Learning GraphQL"* and *"Effective TypeScript"* match the filter *{"name": "e"}*, so *Query.findBooks({"name": "e"})* contains *"Book:2"* and *"Book:3"*
- Only the book name *"Learning GraphQL"* matches the filter  *{"name": "g"}*, so *Query.findBooks({"name": "g"})* only contains *"Book:2"*

Now, mutate the data, change *{id:2, name: "Learning GraphQL"}* to *{id:2, name: "Learning TypeScript"}*. After mutation, the new name *"Learning TypeScript"* no longer matches the query condition *{name: "g"}*. So, the new cache should look like this
```js
{
    "Query": {
        findBooks({"name": "e"}): [{ref: "Book:3"}, {ref: "Book:3"}],

        // Extra mutation: 
        // old data references need to disappear in 'findBooks({"name": "g"})'
        // because the new name "Learning TypeScript" no longer matches the filter '{"name: g"}'
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
> - The "main mutation" is very simple, and this is the developer's intention in itself. 
> - However, "extra mutation" is very troublesome. the existing UI state must be changed like this to adapt to the main mutation.

Here are some classic cases(Not all):
   1. Modify some fields of an object, because the associated collections of other objects may contain filter conditions, does the modified object match these filter conditions? Is it possible that it needs to be added to some collections? Is it possible that it needs to disappear from some collections(*The above example demonstrates this situation*)?
   2. Modify some fields of an object. If the associated collections of other objects use these fields to sort at the business level, do those collections need to be re-odered?
   3. Insert an object. Is it possible that it needs to be automatically added to the associated collection of other objects? If necessary, where to add it?
   4. Link the **A** object to an associated field of the **B** object, or unlink the **A** object from an associated field of the **B** object. If the **A** object also has a reverse associated field that references the **B** object, is this reverse associated field also need to be modified?

There are many possibilities like this，so
> One main mutation causes **N** extra mutations. The more complex the UI, the larger the **N**

How to apply "extra mutations"? Two methods:
1. Manually change the local cache, which is a high-performance but not necessarily feasible method
2. Let the affected queries refetch latest data from the server again, which is a low-performance but always feasible method

Here, we take [Apollo Client](https://github.com/apollographql/apollo-client) and [Relay](https://github.com/facebook/relay) as examples
- For [Apollo Client](https://github.com/apollographql/apollo-client):
  - Modify the cache: [https://www.apollographql.com/docs/react/data/mutations/#updating-the-cache-directly](https://www.apollographql.com/docs/react/data/mutations/#updating-the-cache-directly)
  - Refetch: [https://www.apollographql.com/docs/react/data/mutations/#refetching-queries](https://www.apollographql.com/docs/react/data/mutations/#refetching-queries)
- For [Relay](https://github.com/facebook/relay) 
  it prefers to modify the cache directly: [https://relay.dev/docs/guided-tour/updating-data/graphql-mutations/#updater-functions](https://relay.dev/docs/guided-tour/updating-data/graphql-mutations/#updater-functions)
  
But in actual development, this is painful work

- If you choose to update the local cache locally, you need write code with complex logic by yourself.
- If you choose to let affected queries to refetch data again, it is also difficult to determine which queries is affected by the current mutation so that they must be refetched.

This is the biggest problem of [Apollo Client](https://github.com/apollographql/apollo-client) and [Relay](https://github.com/facebook/relay), the degree of pain is positively related to the complexity of the UI.

## Value of this framework

This framework let developer only focus on main mutation, extra mutations will be handled automatically.

Compare with [Apollo client](https://github.com/apollographql/apollo-client) and [Relay](https://github.com/facebook/relay), after mutation, you only need to save the main mutation into local cache. either need to manually change other affected data in the local cache, nor need to specify which queries will be affected and need to be refetched, because of all the extra mutations is handled automatically.

Inside the framework, it will first try to apply extra mutations by modifying the local cache, if this is not feasible, it will automatically determine which queries are affected and have to be refetched. No matter how the framework chooses, everything is automatic.

-----------------
[Back to home](https://github.com/babyfish-ct/graphql-state)
