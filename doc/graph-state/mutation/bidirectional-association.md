# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../../README.md)/[Graph state](../README.md)/[Mutation](./README.md)/Bidirectional association


Refer to such an example

- "BookStore" has a "books" field, a one-to-many association pointing to "Book"
- In turn, "Book" has a "store" field, a many-to-one association pointing to "BookStore"

From a business perspective, "BookStore.books" and "Book.store" are actually two sides of the same association due to different perspectives. Therefore, graphql-state allows you to bind these two associations into one bidirectional association. Once you have completed this binding, you can get the effect shown in the following GIF animation

|![image](../../../bidirectional-association.gif "Bidirectional assocaition")|
|----|

In this example, the modification you performed is
```
MANNING.books.add(LearningGraphQL);
```
At the same time, graphql-state will perform two automatic updates for you
```
if (cached(O'REILLY.books)) {
    O'REILLY.books.remove(LearningGraphQL);
}
if (cached(LearningGraphQL.store)) {
    LearningGraphQL.store = MANNING;
}
```

> In the above GIF demonstration, I completed the demonstration by modifying the "BookStore" object. 
> In fact, for bidirectional associations, no matter which side of the operation is possible, you can also edit the "Book" object to achieve exactly the same effect. After the attached example runs, you will experience more two-way association-related effects.

## Usage

The implementation method of bidirectional association maintenance is very simple. Since bidirectional association is a binding at the business sense level, there is no equivalent metadata in the GraphQL schema, so we need to enhance the metadata in the configuration phase.

```ts
import { newTypedConfiguration } from "./__generated";

function createStateManager() {
    return new TypedConfiguration()
        .bidirectionalAssociation("BookStore", "books", "store") // BookStore.books <---> Book.store
        .bidirectionalAssociation("Book", "authors", "books") // Book.authors <---> Author.books
        .network(...)
        .buildStateManager();
}
```
The code above is not the only wording, the wording below is equivalent
```ts
import { newTypedConfiguration } from "./__generated";

function createStateManager() {
    return new TypedConfiguration()
        .bidirectionalAssociation("Book", "store", "books") // Book.store <---> BookStore.books
        .bidirectionalAssociation("Author", "books", "authors") // Author.books <---> Book.authors 
        .network(...)
        .buildStateManager();
}
```

> API is strongly typed, don’t worry about spelling errors in the string parameters above, errors will be reported at compile time

-----------

[< Previous: Smart mutation](./smart-mutation.md) | [Back to parent: Mutation](./README.md) 
