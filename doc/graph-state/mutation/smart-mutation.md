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
> - When adding a data to books({name: "a"}), the data must be add into 'books({})'
> - When deleting data from books({}), the data must be removed from 'books({name: "a"})'

因此，tryUnlink的逻辑如下
```ts
tryUnlink(oldId, reason) {
    if (!this.ids.contains(oldId)) {
        return; //要删除的数据早已不存在, 不需要做任何事
    }
    if (containsVariables(this.variables, reason)) {
    
        /*
         * 条件比我宽松的子关联都同意删除旧元素了，我当然同意
         * 
         * 例如: this.variables为{name: "a"}，而reason为{}
         * 既然oldId可以从books({})中被删除，它也一定可以从books({name: "a"})被删除
         */
        this.unlinkDirectly(oldId); 
        
        return; 
    }
    ... 更多的代码 需要进一步判断 ....
}
```
因为conains({name: "a"}, {})，所以，
如果一个元素从books({})中被删除，那么它一定能直接从books({name: "a"})被删除。
很遗憾，上文的案例并没有命中这种情况

tryLink的逻辑如下
```ts
tryLink(newId, reason) {
    if (this.ids.contains(newId)) {
        return; //要添加的新元素已经存在, 不需要做任何事
    }
    if (containsVariables(reason, this.variables)) {
       
        /*
         * 条件比我严格的子关联同意添加新元素了，我当然同意
         * 
         * 例如: this.variables为{}，而reason为{name: "a"}
         * 既然newId可以添加到books({name: "a"})中，它也一定可以添加到books({})中
         */
        this.linkDirectly(newId); 
        
        return;
    }
    ... 更多的代码 需要进一步判断 ....
}
```

经过此variables contains的优化，上个章节的行为变成了
> 暂时忽略
> - tryLink发现要添加的元素已经存在
> - tryUnlink发现要删除的元素早已不存在
>
> 这两种可以提前结束判断的情况

<table>
    <thead>
        <tr>
            <th>期望行为</th>
            <th>判断结果</th>
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
            <td>尚需进一步判定</td>
        </tr>
        <tr>
            <td>
<pre>books({}).tryLink({
    id: id3, 
    reason: {name: "a}
});</pre>
            </td>
            <td>
                因为containsVariables({name: "a"}, {})为true，
                即，比当前子关联条件更严苛的其它同族子关联books({name: "a"})都同意接受新元素了，books({})当然也同意，此修改可以直接在本地缓存上之执行
            </td>
        </tr>
        <tr>
            <td>
<pre>books({name: "b"}).tryUnlink({
    id: id1, 
    reason: {name: "a}
});</pre>
            </td>
            <td>尚需进一步判定</td>
        </tr>
        <tr>
            <td>
<pre>books({name: "b"}).tryLink({
    id: id3, 
    reason: {name: "a}
});</pre>
            </td>
            <td>尚需进一步判定</td>
        </tr>
    </tbody>
</table>

### 1.4. associationProperties.contains

在创建全局的StateManager时，可以为对象之间的关联设置优化器

```ts
import { newTypedConfiguration } from './__generated';

function createStateManager() {
    return newTypedConfiguration()
        .rootAssociationProperites("findBookStores", { ... })
        .assocaitionProperties("BookStore", "authors", {...})
        .network(...)
        .buildStateManager();
}
```
其中
- rootAssociationProperites针对根对象Query的关联字段
- assocaitionProperties针对其他对象的关联字段

二者用法一样

> 注意: API是强类型设计，不用担心"findBookStores", "BookStore"和"authors"等字符串的拼写错误，错误会在编译时呈现。

这里，我们以BookStore.books关系的assocaitionProperties来讲解如何优化BookStore.books。

assocaitionProperties是一个对象，用户可以提供一个contains函数，判断一个数据对象是否应该属于一个关联
```ts
import { FlatRow } from 'graphql-state';

contains(
    row: FlatRow<...GeneratedFlatType...>
    variables: ...GeneratedVariablesType...
) => boolean | undefined;
```
参数
- row: 数据对象
- variables: 当前关联的参数

返回值 
- boolean: 对象是否和关联参数的条件匹配
- undefined: 无法判断，此举会导致优化失败。缓存中数据作废，所有和此关联相关的UI查询自动刷新

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
                    // 如果当前关联没有条件，即books({})，那么此关联一定可以包含row
                    return true; 
                }
                if (row.has("name")) { // 如果name被缓存，检查之
                    return row.get("name").toLowerCase()
                        .indexOf(variables.name.toLowerCase()) !== -1;
                }
                
                // 如果row所代表的数据的name字段没有被缓存，不知道该如何优化
                return undefined; 
            }
        })
        .network(...)
        .buildStateManager();
}
```
> 为了清晰讲解，这里写出了所有类型，并未有任何省略，你在开发中可以省略。

这里
- 先检查子关联的参数是否指定了name，如果没有，直接判定接受元素属于关联
- 如果对象的name被缓存了，检查对象的name是否包含参数的name，并返回检查结果
- 如果对象的name没有被缓存，没有任何办法优化，返回undefine即可

> 注意: 
> 
> 此处只需判断variables?.name是否为undefined，不用考虑null和""，因为
> - null会被自动转化为undefined
> - 如果参数为""且GraphQL schema并没有定义改参数不能为空，自动转化为undefined

至此，上文无法执行的三个操作的执行策略为

<table>
    <thead>
        <tr>
            <th>期望行为</th>
            <th>判断结果</th>
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
                当前子关联无参数
                <ul>
                    <li>
                        <div>如果用户不指定contains</div>
                        不做任何操作，旧对象不应该被移除
                        <div><i>
                            这是没问题的，如果对象在books({name: "a"})中的消失是是因为其它原因导致的
                            (比如，删除操作，或其父对象发生变更)，其它智能更新机制会负责从当前关联中删除它，并非此处讨论的内容。
                        </i></div>
                    </li>
                    <li>
                        <div>如果用户指定了contains</div>
                        不做任何操作，旧对象不应该被移除（对于无参数子关联而言，上文中的用户在contains函数中实现的行为，其实和下文即将讨论的框架的默认行为是一样的）
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
                当前子关联有参数
                <ul>
                    <li>
                        <div>如果用户不指定contains</div>
                        <div>缓存中数据作废，所有和此关联相关的UI查询自动刷新</div>
                    </li>
                    <li>
                        <div>如果用户指定了contains</div>
                        检查用户实现的contains函数的返回值
                        <ul>
                            <li>true: 不做任何操作</li>
                            <li>false: 从当前子关联删除元素</li>
                            <li>undefined: 用户也无法判断。缓存中数据作废，所有和此关联相关的UI查询自动刷新</li>
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
                当前子关联有参数
                <ul>
                    <li>
                        <div>如果用户不指定contains</div>
                        <div>缓存中数据作废，所有和此关联相关的UI查询自动刷新</div>
                    </li>
                    <li>
                        <div>如果用户指定了contains</div>
                        检查用户实现的contains函数的返回值
                        <ul>
                            <li>true: 为当前子关联添加新元素</li>
                            <li>false: 不做任何操作</li>
                            <li>undefined: 用户也无法判断。缓存中数据作废，所有和此关联相关的UI查询自动刷新</li>
                        </ul>
                    </li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>

这个优化是可选的，如果用户没有为assocationProperties指定contains函数，框架默认的的contains行为如下
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

如果关联的variables中所有字段都为undefined，则传递给contains函数的variables整体为undefined。

默认contains的逻辑是，没有参数的关联可以包含任何数据对象。


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
