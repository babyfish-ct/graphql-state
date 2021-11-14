# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../../README.md)/[Graph state](../README.md)/[Mutation](./README.md)/Mutate cache

To mutate the cache, you first need to get the StateManager, please use the "useTypedStateManager" function in the generated code to get the StateManager

```ts
import { FC, memo } form 'react';
import { useTypedStateManager } from './__generated';

export const SomeComponent: FC = memo(() => {

    const stateManager = useTypedStateManager();
    
    ... more code ...
});
```

## 1. Save

StateManager supports a "save" function, it combines insert and update operations, you don’t have to distinguish between insert and update

```ts
save<TName extends <EntityTypeNames> | "Query", T extends object, TVariables extends object = {}>(
    fetcher: ObjectFetcher<TName, T, any>,
    obj: T,
    variables?: TVariables
): void;

save<TName extends <EntityTypeNames>, T extends object, TVariables extends object = {}>(
    fetcher: ObjectFetcher<TName, T, any>,
    objs: readonly T[],
    variables?: TVariables
): void;
```

> Note:
>
> 1. In order to simplify the example, all the code below implies these import statements
>   ```
>   import { ParameterRef } from 'graphql-ts-client';
>   import { book$, book$$, bookStore$$, author$, author$$ } from './__generated/fetchers';
>   ```
> 2. The code below hard-codes a lot of JSON literals. In actual projects, we never hard-code the JSON to be saved, and this document is just to simplify the discussion
> 
> 3. The first parameter is the fetcher of [graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client), and the second parameter is the object graph or object collection which will be saved, the third parameter is an optional query variables. Due to the type safety of [graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client), if there are any spelling errors in the second and third parameters, compilation errors will be repoarted at first time

### 1.1 Save basic object
```

stateManager.save(

    book$$,
    
    { id: "e110c564-23cc-4811-9e81-d587a13db634", name: "Learning GraphQL" }
);
```

### 1.2 Save object using field aliases
```ts
stateManager.save(
    
    book$
    ["id+"](options => options.alias("bookId"))
    ["name+"](options => options.alias("bookName")),
    
    { bookId: "e110c564-23cc-4811-9e81-d587a13db634", bookName: "Learning GraphQL" }
);
```

### 1.3 Save object with associations
```ts
stateManager.save(
    
    book$$
    .store(bookStore$$)
    .authors(author$$),
    
    { 
        id: "e110c564-23cc-4811-9e81-d587a13db634", 
        name: "Learning GraphQL",
        store: {id: "d38c10da-6be8-4924-b9b9-5e81899612a0", name: "O'REILLY"},
        authors: [
            {id: "fd6bb6cf-336d-416c-8005-1ae11a6694b5", name: "Eve Procello"},
            {id: "1e93da94-af84-44f4-82d1-d8a9fd52ea94", name: "Alex Banks"}
        ]
    }
);
```

### 1.4 Only change the association, do not change the associated object

In the above example, we not only modified the Book, but also modified associated objects, for example, "Author.name" was modified. However, in many cases, we only want to modify the association between Book and Author, and do not want to modify any fields of the associated objects.

To achieve this goal, please don't provide any fields other than id for the associated objects.

```ts
stateManager.save(
    
    book$$
    .store(bookStore$$)
    .authors(author$$),
    
    { 
        id: "e110c564-23cc-4811-9e81-d587a13db634", 
        name: "Learning GraphQL",
        store: {id: "d38c10da-6be8-4924-b9b9-5e81899612a0", name: "O'REILLY"},
        authors: [
            {id: "fd6bb6cf-336d-416c-8005-1ae11a6694b5"}, // Only provide id
            {id: "1e93da94-af84-44f4-82d1-d8a9fd52ea94"} // Only provide id
        ]
    }
);
```
**This usage is very important and is frequently used in supporting examples**

### 1.5 Save objects with parameters(parameterized associations)

The most intuitive but not recommended way
```ts
stateManager.save(
    
    book$$
    .store(bookStore$$)
    .authors(
        { name: "eve" }
        author$$
    ),
    
    { 
        id: "e110c564-23cc-4811-9e81-d587a13db634", 
        name: "Learning GraphQL",
        store: {id: "d38c10da-6be8-4924-b9b9-5e81899612a0", name: "O'REILLY"},
        authors: [
            {id: "fd6bb6cf-336d-416c-8005-1ae11a6694b5", name: "Eve Procello"}
        ]
    }
);
```
The more recommended way
```ts
stateManager.save(
    
    book$$
    .store(bookStore$$)
    .authors(
        { name: ParameterRef.of("authorName") }
        author$$
    ),
    
    { 
        id: "e110c564-23cc-4811-9e81-d587a13db634", 
        name: "Learning GraphQL",
        store: {id: "d38c10da-6be8-4924-b9b9-5e81899612a0", name: "O'REILLY"},
        authors: [
            {id: "fd6bb6cf-336d-416c-8005-1ae11a6694b5", name: "Eve Procello"}
        ]
    },
    
    { authorName: "eve" }
);
```

> The association saved in this example is not "Book.authors", but "Book.authors({name: "eve"})"
>
> This is a parameterized association, so just passing the data object that needs to be saved to the "save" function is not enough. This example explains well why the first parameter of the save function should specify the fetcher of [graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client).

### 1.6 Save multiple objects

```ts
stateManager.save(
    book$$
    .authors(
        author$.id
    ),
    [
        { 
            id: "e110c564-23cc-4811-9e81-d587a13db634", 
            name: "Learning GraphQL",
            authors: [
                {id: "fd6bb6cf-336d-416c-8005-1ae11a6694b5"},
                {id: "1e93da94-af84-44f4-82d1-d8a9fd52ea94"}
            ]
        },
        {
            id:"8f30bc8a-49f9-481d-beca-5fe2d147c831",
            name:"Effective TypeScript",
            authors: [
                { id: "c14665c8-c689-4ac7-b8cc-6f065b8d835d" }
            ]
        }
    ]
);
```

## 2. Delete

### 2.1 Delete one object
```
stateManager.delete("Book", "e110c564-23cc-4811-9e81-d587a13db634");
```
> The API is strongly typed, so don’t worry about spelling errors in the string "Book"

### 2.2 Delete multiple objects
```
stateManager.delete(
    "Book", [
        "e110c564-23cc-4811-9e81-d587a13db634",
        "8f30bc8a-49f9-481d-beca-5fe2d147c831"
    ]);
```
> The API is strongly typed, so don’t worry about spelling errors in the string "Book"
-----------------------
[Back to parent: Mutation](./README.md) | [Next: useMutation >](./useMutation.md)
