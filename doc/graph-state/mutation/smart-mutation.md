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

## 2. 对象被插入位置和associationProperties.position函数

### 2.1. position决策

既然对象被自动link到并未被直接修改的集合关联中，这时我们决定其插入位置呢？关联是否有业务层面的排序呢？

假设所有关联数据是按照对象的name字段排序的，无论是Query.findBooks这样的根对象关联，还是BookStore.books这样的普通对象关联。

assocaitionProperties支持一个position函数，我们可以这样来为被自动插入的对象自定义插入位置

```ts
import { FlatRow } from 'graphql-state';

position(
    row: FlatRow<...GeneratedFlatType...>,
    rows: FlatRow<...GeneratedFlatType...>,
    paginationDirection?: "forward" | "backward"
    variables?: ...GeneratedVariablesType...
) => number | "start" | "end" | undefined;
```

参数:
- row: 即将被插入的新元素
- rows: 现在已经存在的数据
- paginationDirection:
  - forward: 当前connection关联使用了forward模式的分页
  - backward: 当前connection关联使用了backward模式的分页
  - undefined: 当前connection关联并未使用分页
  
  > 这里的paginationDirection不可能是"page"，因为page模式的分页无法被优化，总是重新查询。
  
- variables: 关联的查询参数

返回值: 
- start
插入到头部
- end
插入到尾部
- 数字: 
- 如果 <= 0, 插入到头部
- 如果 >= rows.length, 插入到尾部
- 其它情况，插入到指定位置之前
- undefined
无法判断新对象应该插入到什么位置。缓存中数据作废，所有和此关联相关的UI查询自动刷新。
> 注意
> - 如果使用forward分页，如果新数据被定位到尾部且当前页具有下一页，优化行为终止，缓存中数据作废，所有和此关联相关的UI查询自动刷新。 
> - 如果使用backward分页，如果新数据被定位到头部且当前页具有上一页，优化行为终止，缓存中数据作废，所有和此关联相关的UI查询自动刷新。

使用方法如下

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
            
                if (row.has("name")) { // if name of new row is cached
                    const rowName = row.get("name");
                    for (let i = 0; i < rows.length; i++) {
                        if (!rows[i].has("name")) {
                            return undefined;
                        }
                        if (rows[i].get("name") > rowName) {
                            return i;
                        }
                    }
                    return "end";
                }
                return undefined;
            }
        })
        .network(...)
        .buildStateManager();
}
```

使用position，可以轻松规定被link对象的位置。

### 2.2 默认的position

position是可选的，如果用户没有指定，框架默认的的position行为如下
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
即，forward分页下，插入到头部，其余情况，全部插入到尾部。

## 3. 修改对象和和associationProperties.dependencies函数

假如现在有如下数据
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

让我们来看两个案例

1. 执行
```ts
stateManager.set(book$$, {id: "id1", 'effective typescript'});
```
很明显, 修改后的"effective typescript" > Programming TypeScript, 因此业务上期望的效果是这样的
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
books({name: "typ"})的顺序发生了变化。
这种情况的GIF动画演示是
|![image](../../../smart-sorting.gif "智能排序")|
|----|

2. 执行
```ts
stateManager.set(book$$, {id: "id1", 'Effective GraphQL'});
```
很明显, "Effective GraphQL"不再和查询条件{name: "typ"}匹配, 业务上期望的效果是这样的
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
比上个例子变化更大，被修改的对象需要从"A BookStore".books({name: "typ"})中删除，再插入到"A BookStore".books({name: "gra"})中。即，数据在同族的字关系之间迁移。

这种情况的GIF动画演示是
|![image](../../../optimized-mutation.gif "数据迁移")|
|----|

如何让graphql-state实现上面这两种效果呢？

答案很简单，让graphql-state知道books({...})依赖于其对象的name字段即可，这样，被依赖的对象name字段发生变更的时候，graphql-state就可以利用associationProperties的contains和position函数，进行单个子关联内部重新排序，甚至不同子关联之间的数据迁移。

associationProperties支持一个dependencies函数，返回当前关联依赖其数据对象的那些字段
```ts
readonly dependencies?: (
    variables?: ...GeneratedVariablesType...
) => ReadonlyArray<keyof ...GeneratedFlatType...> | undefined;
```
参数
- variables: 关联的查询参数

返回值
- array: 依赖字段集合
- undefined: - undefined: 无法判断，此举会导致优化失败。缓存中数据作废，所有和此关联相关的UI查询自动刷新

使用方式如下

```ts
function createStateManager() {
    return newTypedConfiguration()
        .rootAssocaitionProperties("findBooks", {
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

> 这个例子中，数据对象的name字段需要用于排序，所以对dependencies函数忽略当前关联的参数，无条件返回包含name的数组。
> 
> 有时，项目需求可能不是这样的。我们可能希望对象的name仅仅用于按关联条件筛选，而不会被用于排序，这时，你可以如此实现
> ```ts
> if (variables.name !== undefined) {
>     return ["name"];
> }
> return [];
> ```

如果不指定dependences, 框架默认实现如下
```ts
dependencies: (
    variables?: any
): ReadonlyArray<string> | undefined => {
    return variables === undefined ? [] : undefined;
}
```

## 调整分页结果

上文提到，未被直接修改的关联有可能被框架自动修改，tryLink行为可能插入新的数据，tryUnlink行为可能删除已有数据。这种情况下，分页结果将会被破坏，可能会影响后续翻页操作。

有两种情况，需要调整分页结果

- Connection类型中有表示分页前记录总条数的字段，比如附带例子中的totalCount字段
- 分页是基于行数偏移量的分页，而非基于对象id

associationProperties对象接受一个range函数来调整分页结果，其定义如下
```
range(
    range: {
        endCursor: string,
        [key: string]: any
    },
    delta: number,
    direction: "forward" | "backward"
) => void;
```
参数:
  - range: 分页范围，你需要在函数中修改此对象
    - startCursor: 其实游标
    - endCursor: 结束游标
    - 其它任何字段
  - delta
    变化行数，正数表示新的数据被添加到当前关联中；负数表示有数据从当前关联中被移除
  - direaction: 分页方向，forward或backward
  > 不可能是page，因为page分页不可优化，总是重新查询。

如果你的分页面是基于对象id的，你只需要调整totalCount
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

如果你的分页面是基于行数偏移的且分页方向为forward，你还需要调整endCursor
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

## 后续版本会改进的地方

当前版本的实现并不完善，它依赖两个假设

1. 没有任何参数的关联就代表所有数据
2. 有参数的关联不一定能代表所有数据

但是，有些时候，这两点假设是不成立的

第一点的反例: 假设有一个查询字段Query.findActiveUsers(), 虽然此关联没有任何参数，但是故名思义，它隐含了过滤逻辑。此关联仅代表所有active为true的数据，而非所有数据。

第二点的反例: 假设有一个查询字段Query.findRows(orderFieldName: string, descending: boolean), 这两个参数仅用于动态排序，没有过滤数据的意图，无论它们被如何指定，此关联都能代表所有数据。

稍后的版本会处理这两种情况

--------------------------------

[< Previous: useMutation](./useMutation.md) | [Back to parent: 变更](./README.md) | [Next: 双向关联 >](./bidirectional-association.md)
