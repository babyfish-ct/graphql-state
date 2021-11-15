# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../../README.md)/[Graph state](../README.md)/[Mutation](./README.md)/Smart mutation

The process of smart mutation is as follows

![image](../../../smart-mutation.png "smart mutation")

This picture has been discussed on the homepage, so I won’t repeat it here.

This document focuses on two points:

- How does the framework decide whether to modify local data or re-query?
- If a user is willing to intervene in the decision-making process, how should he participate in optimization?

## 1. Association mutation and "associationProperties.contains" function

### 1.1. Association family and sub association

In GraphQL, associations have parameters. Take [the server side of attached demo](https://github.com/babyfish-ct/graphql-state/tree/master/example/server) as an example, Its sdl looks like this
```
type Query {
    findBookStores(name: String): [BookStore!]!
    findBooks(name: String): BookConnnection!
    findAuthors(name: String): AuthorConnnection!
    
    ...
    
}
type BookStore {
    books(name: String): [Book!]!
    ...
}

type Book {
    authors(name: String): [Author!]!
    ...
}

type Author {
    books(name: String): [Book!]!
}

...

```

We see that "Query.findBookStores", "Query.findBooks", "Query.findAuthors", "BookStore.books", "Book.authors" and "Author.books" are all parameterized.

One association can be used to create different instances with different parameters, such as

```
----+-Query.findBookStores
    |
    +---- Query.findBooksStores({})
    |
    +---- Query.findBooksStores({name: "a"})
    |
    \---- Query.findBooksStores({name: "b"})

----+- Book.authors
    |
    +---- Book.authors({})
    |
    +---- Book.authors({name: "a"})
    |
    \---- Book.authors({name: "b"})
```

As shown in the figure above, we call it two association families, each family has three sub-associations

### 1.2. link and unlink

Look at the code below

```ts
stateManager.save(

    bookStore$
    .id
    .books(
        { name: ParameterRef.of(bookName) },
        author$.id
    ),
    
    {
        id: storeId,
        books: [
            {id: id2 }, 
            {id: id3 }
        ]
    }
    
    { bookName: "a" }
)
```
This code attempts to modify the sub-association 'books({name: "a"})' of the BookStore object whose id is "storeId"

Suppose the old value of 'books({name: "a"})' is now [id1, id2], and the new value expected to be modified is [id2, id3]. Comparing the new and old data, the deleted Book is [id1], and the added Book is [id3].

For the "BookStore" object, in addition to the directly modified sub-association 'books ({name: "a})', there are two other sub-associations of the same family, 'books({})' and 'books({name: "b"})'.

Next, the framework do this

```ts

// books({}) is affected by the mutation of books({name: "a"})
books({}).tryUnlink({
    id: id1, 
    reason: {name: "a}
});

// books({}) is affected by the mutation of books({name: "a"})
books({}).tryLink({
    id: id3, 
    reason: {name: "a}
});

// books({name: "b"}) is affected by the mutation of books({name: "a"})
books({name: "b"}).tryUnlink({
    id: id1, 
    reason: {name: "a}
});

// books({name: "b"}) is affected by the mutation of books({name: "a"})
books({name: "b"}).tryLink({
    id: id3, 
    reason: {name: "a} 
});
```
This shows that the changes of 'books({name: "a"})' may affect 'books({})' and 'books({name: "b"})'. which is

> **The sub-associations in the same family will affect each other; any one is modified, the rest will be executed unlink or link operation**

### 1.3. Internal optimization, comparing the parameters of the sub-association within the same family

> This part of the content is the internal optimization of graphql-state, which can simplify the judgment process of
> ```
> books({}).tryLink(id: id3, reason: {name: "a"})
> ```
> above.
> 
> This internal optimization behavior is transparent to users, if you are not interested, you can skip to 1.4

In order to better judge whether the local cache can be modified directly, a concept "containsVariables" is introduced to determine the containment relationship between query variables.

> "variables" refer to the association parameters, as '{}', "{name: "a"}", "{name: "b"}"

```ts
containsVariables(variables1, variables2): boolean
```

This method determines whether variable1 contains variables2, that is, all fields of variable2 exist in variables1 and their values are equal

|Example|Result|
|--------|--------|
|containsVariables({k1: 'A', k2: 'B'}, {k1: 'A'})|true|
|containsVariables({k1: 'A'}, {k1: 'A', k2: 'B'})|false|
|||
|containsVariables({name: "a"}, {name: "a")|true|
|||
|containsVariables({name: "a"}, {name: "b")|false|
|containsVariables({name: "b"}, {name: "a")|false|
|||
|containsVariables({name: "a"}, udefined)|true|
|containsVariables(undefined, {name: "a"})|false|
|||
|containsVariables(undefined, udefined)|true|

> An important rule that can be optimized within the framework
>
> If contains(variables1, variables) is true, then
>
> someAssocaiton(variables1) ∈ someAssocaiton(variables2).
>
> That is, if the association parameter "variable1" is more stringent than "variables2", then the data queried by "variables1" must be part of the data queried by "variables2". E.g
>
> books({name: "a"}) ∈ books({})
>
> - When adding a data to 'books({name: "a"})', the data must be add into 'books({})'
> - When deleting data from 'books({})', the data must be removed from 'books({name: "a"})'

Therefore, the logic of 'tryUnlink' is as follows
```ts
tryUnlink(oldId, reason) {
    if (!this.ids.contains(oldId)) {
        return; //The data to be deleted no longer exists, no need to do anything
    }
    if (containsVariables(this.variables, reason)) {
    
        /*
         * The sub-associations with looser conditions than mine 
         * agree to delete the old elements, I certainly agree
         *
         * For example: this.variables is '{name: "a"}', and reason is '{}'
         * Since oldId can be deleted from 'books({})', 
         * it must also be deleted from 'books({name: "a"})'
         */
        this.unlinkDirectly(oldId); 
        
        return; 
    }
    ... more code, further judgment is needed...
}
```
Because 'conainsVariables({name: "a"}, {})' is true, so,
If an element is deleted from 'books({})', it must be deleted from 'books({name: "a"})' too.
Unfortunately, the above case did not hit this situation

The logic of "tryLink" is as follows
```ts
tryLink(newId, reason) {
    if (this.ids.contains(newId)) {
        return; //The new element to be added already exists, no need to do anything
    }
    if (containsVariables(reason, this.variables)) {
       
        /*
         * The sub-associations with stricter conditions than mine 
         * agree to add new elements, I certainly agree
         *
         * For example: this.variables is '{}', and reason is '{name: "a"}'
         * Since newId can be added to 'books({name: "a"})', 
         * it must be added to 'books({})'
         */
        this.linkDirectly(newId); 
        
        return;
    }
    ... more code, further judgment is needed...
}
```

After this optimization, the behavior of the previous chapter becomes
> Temporarily ignore 
> - "tryLink" found that the element to be added already exists
> - "tryUnlink" found that the element to be deleted no longer exists
>
> These two situations can end the judgment early

<table>
    <thead>
        <tr>
            <th>Expected behavior</th>
            <th>Judgment result</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
<pre>books({}).tryUnlink({
    id: id1, 
    reason: {name: "a}
});</pre>
            </td>
            <td>Need to be further judged</td>
        </tr>
        <tr>
            <td>
<pre>books({}).tryLink({
    id: id3, 
    reason: {name: "a}
});</pre>
            </td>
            <td>
                Because 'containsVariables({name: "a"}', {}) is true,
                That means other same-family sub-association 'books({name: "a"})' with more stringent variables agree to accept the new element,
                of course, the current sub-assocaition 'books({})' also agrees. 
                This modification can be directly executed on local cache.
            </td>
        </tr>
        <tr>
            <td>
<pre>books({name: "b"}).tryUnlink({
    id: id1, 
    reason: {name: "a}
});</pre>
            </td>
            <td>Need to be further judged</td>
        </tr>
        <tr>
            <td>
<pre>books({name: "b"}).tryLink({
    id: id3, 
    reason: {name: "a}
});</pre>
            </td>
            <td>Need to be further judged</td>
        </tr>
    </tbody>
</table>

### 1.4. associationProperties.contains

When creating a global StateManager, you can set an optimizer for the associations

```ts
import { newTypedConfiguration } from './__generated';

function createStateManager() {
    return newTypedConfiguration()
        .rootAssociationProperites("findBookStores", { ... })
        .assocaitionProperties("BookStore", "books", {...})
        .network(...)
        .buildStateManager();
}
```
- "rootAssociationProperites" is used for the association fields of the root object Query
- "assocaitionProperties" is used for the association fields of other objects

Both of them have the same usage

> Note: The API is a strongly typed design. Don't worry about spelling errors in strings such as "findBookStores", "BookStore" and "books". The errors will appear at compile time.

Here, we take the assocaitionProperties of "BookStore.books" as an example to explain how to optimize "BookStore.books".

"assocaitionProperties" is an object, the user can provide a "contains" function to determine whether a data object should belong to an association

```ts
import { FlatRow } from 'graphql-state';

contains(
    row: FlatRow<...GeneratedFlatType...>
    variables: ...GeneratedVariablesType...
) => boolean | undefined;
```
Parameters
- row: data object
- variables: parameters of current association

Return value 
- boolean: whether the object matches the filter condition of current association
- undefined: Unable to judge, this will cause optimization failure. The data in the cache will be evicted, and all UI queries related to this association will be automatically refreshed.

```ts
import { FlatRow } from 'graphql-state';
import { BookStoreArgs, BookFlatType } from './generated/fetchers';

function createStateManager() {
    return newTypedConfiguration()
        .assocaitionProperties("BookStore", "books", {
            contains: (
                row: FlatRow<BookFlatType>,
                variables?: BookStoreArgs["books"]
            ) => boolean | undefined {
            
                if (variables?.name === undefined) {
                    // If "variables.name" is not specified by current sub association,
                    // assocaition accept every thing, always contains the data
                    return true; 
                }
                if (row.has("name")) { // If name of data is cached
                    // Check whether the name of data matches the filter of association
                    return row.get("name").toLowerCase()
                        .indexOf(variables.name.toLowerCase()) !== -1;
                }
                
                // If the name of the data is not cached, I don’t know how to optimize
                return undefined; 
            }
        })
        .network(...)
        .buildStateManager();
}
```
> In order to explain clearly, all types are written here, without any omissions, you can omit them during development.

Here
- First check whether the variables of the sub-association specifies name, if not, directly determine that the accepted element belongs to the association
- If the name of the data object is cached, check whether the name of the object contains the name of the variables, and return the result
- If the name of data object is not cached, there is no way to optimize it, just return to undefine

> Note:
>
> Here only need to judge whether variable?.name is undefined, no need to consider null and "", because
> - null will be automatically converted to undefined
> - If variable is "" and its type is GraphQLNonNull, it will automatically be converted to undefined

So far, the execution strategy of the three operations that cannot be performed above is

<table>
    <thead>
        <tr>
            <th>Expected behavior</th>
            <th>Judgment result</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
<pre>books({}).tryUnlink({
    id: id1, 
    reason: {name: "a}
});</pre>
            </td>
            <td>
                The current sub-association is not parameterized
                <ul>
                    <li>
                        <div>If the user does not specify "associationProperites.contains"</div>
                        Do nothing, old objects should not be removed
                        <div><i>
                            This is no problem, if the object disappears from 'books({name: "a"})' 
                            because of other reasons(For example, delete operation, or its parent object changes), 
                            other smart update mechanisms will be responsible for deleting it from the current association, 
                            which is not the content discussed here.
                        </i></div>
                    </li>
                    <li>
                        <div>If the user specifies "associationProperties.contains"</div>
                        Do nothing, and the old object should not be removed 
                        (For the parameterless sub-association, the behavior implemented 
                        by the user in the "associationProperties.contains" function above 
                        is actually the same as the default behavior which will be discussed later)
                    </li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
<pre>books({name: "b"}).tryUnlink({
    id: id1, 
    reason: {name: "a}
});</pre>
            </td>
            <td>
                The current sub-assocaition is parameterized
                <ul>
                    <li>
                        <div>If the user does not specify "associationProperites.contains"</div>
                        <div>The data in the cache will be evicted, and all UI queries related to this association will automatically refreshed</div>
                    </li>
                    <li>
                        <div>If the user specifies "associationProperties.contains"</div>
                        Check the return value of the "contains" function implemented by the user
                        <ul>
                            <li>true: Do nothing</li>
                            <li>false: Remove elements from the current sub-association</li>
                            <li>undefined: User can't judge either. The data in the cache will be evicted, and all UI queries related to this association will automatically refreshed</li>
                        </ul>
                    </li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
<pre>books({name: "b"}).tryLink({
    id: id3, 
    reason: {name: "a}
});</pre>
            </td>
            <td>
                The current sub-assocaition is parameterized
                <ul>
                    <li>
                        <div>If the user does not specify "associationProperites.contains"</div>
                        <div>The data in the cache will be evicted, and all UI queries related to this association will automatically refreshed</div>
                    </li>
                    <li>
                        <div>If the user specifies "associationProperties.contains"</div>
                        Check the return value of the "contains" function implemented by the user
                        <ul>
                            <li>true: Add a new element into the current sub-association</li>
                            <li>false: Do nothing</li>
                            <li>undefined: User can't judge either. The data in the cache will be evicted, and all UI queries related to this association will automatically refreshed</li>
                        </ul>
                    </li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>

This optimization is optional. If the user does not specify the "contains" function for "assocationProperties", the default "contains" behavior of the framework is as follows
```ts
function defaultContains(
    row: FlatRow<BookFlatType>,
    variables?: BookStoreArgs["books"]
) => boolean | undefined {
    if (variables === undefined) {
        return true; 
    }
    return undefined; 
}
```

> If all fields of variables are undefined, the variables passed to the contains function are undefined as a whole.

The logic of default "contains" is that associations without variables can contain any data object.

## 2. The position where the object is inserted and the "associationProperties.position" function

### 2.1. position decision

Since an object can be automatically linked to a collection sub-association that has not been directly modified, how do we determine its insertion position? Is there a business-level ordering requirement for associations?

Assume that all associated data is sorted according to the "name" field of the object, whether it is a root object association such as "Query.findBookStores" or a normal object association such as "BookStore.books".

"assocaitionProperties" supports a "position" function, we can customize the insertion position for the automatically linked object like this


```ts
import { FlatRow } from 'graphql-state';

position(
    row: FlatRow<...GeneratedFlatType...>,
    rows: FlatRow<...GeneratedFlatType...>,
    paginationDirection?: "forward" | "backward"
    variables?: ...GeneratedVariablesType...
) => number | "start" | "end" | undefined;
```

**Parameters**
- row: the new element to be inserted
- rows: existing data collection
- paginationDirection:
  - forward: The current connection association uses the "forward" mode pagination
  - backward: The current connection assocaition uses the "backward" mode pagination
  - undefined: The current connection association does not use pagination
  
  > The paginationDirection here cannot be "page", because the pagination in page mode cannot be optimized, it is always re-queried.
  
- variables: query parameters of current sub-association

**Return value**
- start: 
  Insert to the head
- end: 
  Insert at the end
- number: 
  - If <= 0, insert to the head
  - If >= rows.length, insert to the end
  - In other cases, insert before the specified position
- undefined
  It is impossible to determine where the new object should be inserted. The data in the cache will be evicted, and all UI queries related to this association will be automatically refreshed.
> Note
> - When you use the "forward" pagination, if the new data is positioned to the tail of the current page and "hasNext" is true, the optimization behavior will be terminated, that means the data in the local cache will evicted, and all UI queries related to this association will be automatically refreshed.
> - When you use the "backward" pagination, if the new data is positioned to the head of the current page and "hasPrevious" is true, the optimization behavior will be terminated, that means the data in the local cache will evicted, and all UI queries related to this association will be automatically refreshed.

Usage is as follows

```ts
import { FlatRow } from 'graphql-state';
import { BookStoreArgs, BookFlatType } from './generated/fetchers';

function createStateManager() {
    return newTypedConfiguration()
        .assocaitionProperties("BookStore", "books", {
            contains: ...,
            position: (
                row: FlatRow<BookFlatType>,
                rows: ReadonlyArray<FlatRow<BookFlatType>>,
                paginationDirection?: "forward" | "backward"
                variables?: BookStoreArgs["books"]
            ) => number | "start" | "end" | undefined {
            
                // if name of new row is cached
                if (row.has("name")) { 
                    
                    const rowName = row.get("name");
                    
                    for (let i = 0; i < rows.length; i++) {
                    
                        // if name of existing row is not cached
                        if (!rows[i].has("name")) {
                            return undefined;
                        }
                        if (rows[i].get("name") > rowName) {
                            return i;
                        }
                    }
                    return "end";
                }
                
                // I don't know
                return undefined;
            }
        })
        .network(...)
        .buildStateManager();
}
```

Using "position" function, you can easily specify the position of the linked object.

### 2.2 Default position

The "position" is optional. If the user does not specify it, the default position behavior of the framework is as follows
```ts
defaultPosition: (
    row: FlatRow<BookFlatType>,
    rows: ReadonlyArray<FlatRow<BookFlatType>>,
    paginationDirection?: "forward" | "backward"
    variables?: BookStoreArgs["books"]
) => number | "start" | "end" | undefined {
    return paginationDirection === "forward" ? "start" : "end";
}
```
That is, if the current pagination is in "forward" mode, it is inserted to the head, and in other cases, it is inserted to the tail.

## 3. Modify the object and "associationProperties.dependencies" function

If you have the following data
```
+-------------+
| A BookStore |
+---+---------+
    |
    |                             +-----+------------------------+
    +----books({name: "typ"})---->| id  | name                   |
    |                             +-----+------------------------+
    |                             | id1 | Effective TypeScript   |
    |                             | id2 | Programming TypeScript |
    |                             +-----+------------------------+
    |
    |                             +-----+------------------------+
    \----books({name: "gra"})---->| id  | name                   |
                                  +-----+------------------------+
                                  | id3 | Learning GraphQL       |
                                  +-----+------------------------+
```

Let's look at two cases

1. Execute
```ts
stateManager.set(book$$, {id: "id1", 'effective typescript'});
```
Obviously, the revised "effective typescript"> Programming TypeScript, so the expected business effect is like this
```
+-------------+
| A BookStore |
+---+---------+
    |
    |                                 +-----+------------------------+
    +----findBooks({name: "typ"})---->| id  | name                   |
    |                                 +-----+------------------------+
    |                                 | id2 | Programming TypeScript |
    |                                 | id1 | effective typescript   |
    |                                 +-----+------------------------+
    |
    |                                 +-----+------------------------+
    \----findBooks({name: "gra"})---->| id  | name                   |
                                      +-----+------------------------+
                                      | id3 | Learning GraphQL       |
                                      +-----+------------------------+
```
The order of 'books({name: "typ"})' has beean changed.

The animated GIF presentation of this situation is

|![image](../../../smart-sorting.gif "Smart sorting")|
|----|

2. Execute
```ts
stateManager.set(book$$, {id: "id1", 'Effective GraphQL'});
```
Obviously, "Effective GraphQL" no longer matches the query condition {name: "typ"}, the expected effect in business is this
```
+-------------+
| A BookStore |
+---+---------+
    |
    |                             +-----+------------------------+
    +----books({name: "typ"})---->| id  | name                   |
    |                             +-----+------------------------+
    |                             | id2 | Programming TypeScript |
    |                             +-----+------------------------+
    |
    |                             +-----+------------------------+
    \----books({name: "gra"})---->| id  | name                   |
                                  +-----+------------------------+
                                  | id1 | Effective GraphQL      |
                                  | id3 | Learning GraphQL       |
                                  +-----+------------------------+
```
The modified object needs to be deleted from "A BookStore".'books({name: "typ"})', and inserted into "A BookStore".'books({name: "gra"})'. That is, data migrates between sub-associations of the family.

The animated GIF presentation of this situation is
|![image](../../../optimized-mutation.gif "Data migration")|
|----|

How to make graphql-state achieve the above two effects?

The answer is simple, let graphql-state know that 'books({...})' depends on the "name" field of its objects, so that when the "name" field of the dependent objects change, graphql-state can use the "contains" and "position" of "associationProperties" to re-sort sub-association or perform data migration between different sub-associations.

"associationProperties" supports a "dependencies" function that returns some field names of the data object, the current sub-association depends on them.

```ts
readonly dependencies?: (
    variables?: ...GeneratedVariablesType...
) => ReadonlyArray<keyof ...GeneratedFlatType...> | undefined;
```
**Parameters**
- variables: parameters of current sub-assocaition

返回值
- array: List of dependent field names
- undefined: Unable to judge, this will cause optimization to fail. The data in the local cache will be evicted, and all UI queries related to this association will automatically be refreshed

Usage

```ts
function createStateManager() {
    return newTypedConfiguration()
        .assocaitionProperties("BookStore", "books", {
            contains: ...,
            position: ...,
            dependencies: (
                variables?: BookStoreArgs["findBooks"]
            ) => ReadonlyArray<keyof BookFlatType> {
                return ["name"];
            }
        })
        .network(...)
        .buildStateManager();
}
```

> In this example, the "name" field of the data object is used for sorting, so the "variables" of current sub-association is ignored, and an array containing " name" is returned unconditionally.
> 
> Sometimes, the project requirements may not be like this. We may hope that the "name" field of data object is only used to filter by association variables, but not to be used for sorting. At this time, you can achieve this
> ```ts
> if (variables.name !== undefined) {
>     return ["name"];
> }
> return [];
> ```

If you do not specify "dependencies", the default implementation of the framework is as follows
```ts
dependencies: (
    variables?: any
): ReadonlyArray<string> | undefined => {
    return variables === undefined ? [] : undefined;
}
```

## Adjust pagination results and "associationProperties.range"

As mentioned above, sub-associations that have not been directly modified may be automatically modified by the framework, "tryLink" behavior may insert new data, and "tryUnlink" behavior may delete existing data. In this case, the pagination result will be destroyed, which may affect subsequent page turning operations.

There are two situations, you need to adjust the paging results

- There is a field in the connection type that indicates the total number of records before paging, such as the "totalCount" field in the attached example
- Pagination is based on row offset, not based on object id

The "associationProperties" object accepts a "range" function to adjust the pagination results, which is defined as follows

```ts
range(
    range: {
        endCursor: string,
        [key: string]: any
    },
    delta: number,
    direction: "forward" | "backward"
) => void;
```
**参数**
  - range: Paging range, you need to modify this object in the function
    - endCursor: End cursor
    - Any other fields, of course, including the possible field "totalCount"
  - delta
    Detal of number of rows, positive number indicates that new data is added to the current page; negative number indicates that data is removed from the current page
  - direction: Pagination direction, "forward" or "backward"
  > > It cannot be "page", because "page" style pagination cannot be optimized, it always re-query.

If your pagination is based on object id, you only need to adjust "totalCount"
```ts
function createStateManager() {
    return newTypedConfiguration()
        .rootAssocaitionProperties("findBooks", {
            contains: ...,
            position: ...,
            dependencies: ...,
            range: range => {
                range.totalCount += delta;
            }
        })
        .network(...)
        .buildStateManager();
}
```

If your pagination is based on row number offset and the page direction is "forward", you also need to adjust the "endCursor"
```ts
function createStateManager() {
    return newTypedConfiguration()
        .rootAssocaitionProperties("findBooks", {
            contains: ...,
            position: ...,
            dependencies: ...,
            range: range => {
                range.totalCount += delta;
                if (direction === "forward") {
                    range.endCursor = indexToCursor(cursorToIndex(range.endCursor) + delta);
                }
            }
        })
        .network(...)
        .buildStateManager();
}
function indexToCursor(index: number): string {
    return Buffer.from(index.toString(), 'utf-8').toString('base64');
}

function cursorToIndex(cursor: string): number {
    return parseInt(Buffer.from(cursor, 'base64').toString('utf-8'));
}
```

## What will be improved in subsequent versions?

The implementation of the current version is not perfect, it relies on two assumptions

1. Sub-association without variables always represents all data
2. Sub-association with variables cannot represent all data

However, sometimes these two assumptions are not true

Counterexample to the first point: Suppose there is a query field "Query.findActiveUsers()". Although this association does not have any variables, as the name suggests, it implies filtering logic. This sub-association only represents data whose active is true, not all data.

Counterexample to the second point: Suppose there is a query field "Query.findRows(orderFieldName: string, descending: boolean)". These two parameters are only used for dynamic sorting and have no intention of filtering data. No matter how they are specified, this sub-association can Represents all data.

A later version will handle both cases. Before that, I hope to listen to the opinions of everyone

--------------------------------

[< Previous: useMutation](./useMutation.md) | [Back to parent: Mutation](./README.md) | [Next: Bidirectional association >](./bidirectional-association.md)
