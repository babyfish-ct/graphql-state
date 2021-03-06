# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../../README_zh_CN.md)/[图状态](../README_zh_CN.md)/[变更](./README_zh_CN.md)/智能变更

智能变更的流程如下

![image](../../../site/smart-mutation_zh_CN.png "smart mutation")

此图图在首页中已经讨论过了，这里不再赘述。

本文档重点讨论两点：

- 框架如何抉择只需修改本地数据还是需要重新查询?
- 如果用户愿意介入抉择过程，他应该如何参与优化?

## 1. 关联修改和associationProperties.contains函数

### 1.1. 关联族和子关联

在GraphQL中，关联是具备参数的，以[附带例子的服务端](https://github.com/babyfish-ct/graphql-state/tree/master/example/server)为例，其提供的服务定义如下

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

我们看到，Query.findBookStores, Query.findBooks, Query.findAuthors, BookStore.books, Book.authors和Author.books都是参数化的。

同一个关系，可以由不同参数的创建不同的实例，比如

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

如上图，我们称其为有两个关联族，每个族中有三个子关联

### 1.2. link和unlink

请观察下面的代码
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
这段代码试图修改id为storeId的BookStore对象的子关联books({name: "a"})

假设books({name: "a"})现在的旧值为[id1, id2]，而期望修改的新值为[id2, id3]。对比新旧数据，被删除的Book为[id1]，被添加的Book为[id3]。

当前BookStore对象，除了具备当前的books({name: "a})这个被直接修改的子关联外，还有另外两个子同族的子关联books({})，books({name: "b"})，接下来，框架即将尝试
```ts
books({}).tryUnlink({
    id: id1, 
    reason: {name: "a} // books({})被books({name: "a"})的变更影响
});
books({}).tryLink({
    id: id3, 
    reason: {name: "a} // books({})被books({name: "a"})的变更影响
});
books({name: "b"}).tryUnlink({
    id: id1, 
    reason: {name: "a} // books({name: "b"})被books({name: "a"})的变更影响
});
books({name: "b"}).tryLink({
    id: id3, 
    reason: {name: "a} // books({name: "b"})被books({name: "a"})的变更影响
});
```
这说明，books({name: "a"})的变化有可能对books()和books({name: "b"})形成影响。即

> **同族内的子关联之间会相互影响; 任何一个被修改，其余的都会被执行unlink或link操作**

### 1.3. 内部优化，对比同族内子关联的参数

> 这部分内容是graphql-state内部优化，可以让上文中的
> ```
> books({}).tryLink(id: id3, reason: {name: "a"})
> ```
> 的判断过程得到简化。
> 
> 这种内部优化行为对用户而言透明，如果不感兴趣，可以直接跳到1.4

为了更好地判断是否可以直接修改缓存，引入了一个概念containsVariables，判断查询参数之间的包含关系。

> 其中，variables指关联的参数，如同上文中的{}, { name: "a"}, {name: "b"}

```ts
containsVariables(variables1, variables2): boolean
```
此方法件判断variables1是否包含variables2，即variables2的所有字段都在variables1中存在且它们的值相等
|例子|判断值|
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

> 一个重要的规律，可以框架内部优化
> 
> 如果contains(variables1, variables)成立，那么
> 
> someAssocaiton(variables1) ∈ someAssocaiton(variables2)。
> 
> 即，如果关联参数variable1比variables2更严格，那么variables1能查询到的数据一定是variables2能查询到的数据的一部分。例如
> 
> books({name: "a"}) ∈ books({})
> 
> - 向books({name: "a"})中添加一个数据时，一定需要向books({})中添加数据
> - 从books({})中删除数据时，一定需要从books({name: "a"})中删除数据

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
因为conainsVariables({name: "a"}, {})为true，所以，
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

经此优化，上个章节的行为变成了
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
        .assocaitionProperties("BookStore", "books", {...})
        .network(...)
        .buildStateManager();
}
```
其中
- rootAssociationProperites针对根对象Query的关联字段
- assocaitionProperties针对其他对象的关联字段

二者用法一样

> 注意：API是强类型设计，不用担心"findBookStores", "BookStore"和"books"等字符串的拼写错误，错误会在编译时呈现。

这里，我们以BookStore.books关系的assocaitionProperties为例来讲解如何优化BookStore.books。

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

> 注意：
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
                        <div>如果用户不指定associationProperties.contains</div>
                        不做任何操作，旧对象不应该被移除
                        <div><i>
                            这是没问题的，如果对象从books({name: "a"})中消失是是因为其它原因导致的
                            (比如，删除操作，或其父对象发生变更)，其它智能更新机制会负责从当前关联中删除它，并非此处讨论的内容。
                        </i></div>
                    </li>
                    <li>
                        <div>如果用户指定了associationProperties.contains</div>
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

> 如果关联的variables中所有字段都为undefined，则传递给contains函数的variables整体为undefined。

默认contains的逻辑是，没有参数的关联可以包含任何数据对象。


## 2. 对象被插入位置和associationProperties.position函数

### 2.1. position决策

既然对象可以被自动link到并未被直接修改的集合子关联中，这时我们如何决定其插入位置呢？关联是否有业务层面的排序要求呢？

假设所有关联数据是按照对象的name字段排序的，无论是Query.findBookStores这样的根对象关联，还是BookStore.books这样的普通对象关联。

assocaitionProperties支持一个position函数，我们可以这样来为被自动link的对象自定义插入位置

```ts
import { FlatRow } from 'graphql-state';

position(
    row: FlatRow<...GeneratedFlatType...>,
    rows: FlatRow<...GeneratedFlatType...>,
    paginationDirection?: "forward" | "backward"
    variables?: ...GeneratedVariablesType...
) => number | "start" | "end" | undefined;
```

**参数**
- row: 即将被插入的新元素
- rows: 现在已经存在的数据
- paginationDirection:
  - forward: 当前connection关联使用了forward模式的分页
  - backward: 当前connection关联使用了backward模式的分页
  - undefined: 当前connection关联并未使用分页
  
  > 这里的paginationDirection不可能是"page"，因为page模式的分页无法被优化，总是重新查询。
  
- variables: 关联的查询参数

**返回值**
- start
插入到头部
- end
插入到尾部
- 数字：
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
            
                // 如果新数据的name被缓存
                if (row.has("name")) { 
                
                    const rowName = row.get("name");
                
                    for (let i = 0; i < rows.length; i++) {
                    
                        // 如果现有数据的name没有被缓存
                        if (!rows[i].has("name")) {
                            return undefined;
                        }
                        if (rows[i].get("name") > rowName) {
                            return i;
                        }
                    }
                    return "end";
                }
                
                // 我不知道
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
|![image](../../../site/smart-sorting.gif "智能排序")|
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
比上个例子变化更大，被修改的对象需要从"A BookStore".books({name: "typ"})中删除，再插入到"A BookStore".books({name: "gra"})中。即，数据在同族的子关系之间迁移。

这种情况的GIF动画演示是
|![image](../../../site/optimized-mutation.gif "数据迁移")|
|----|

如何让graphql-state实现上面这两种效果呢？

答案很简单，让graphql-state知道books({...})依赖于其对象的name字段即可，这样，被依赖的对象name字段发生变更的时候，graphql-state就可以利用associationProperties的contains和position函数，进行单个子关联内部重新排序，甚至不同子关联之间的数据迁移。

associationProperties支持一个dependencies函数，返回当前关联依赖其数据对象的那些字段
```ts
readonly dependencies?: (
    variables?: ...GeneratedVariablesType...
) => ReadonlyArray<keyof ...GeneratedFlatType...> | undefined;
```
**参数**
- variables: 关联的查询参数

**返回值**
- array: 依赖字段集合
- undefined: 无法判断，此举会导致优化失败。缓存中数据作废，所有和此关联相关的UI查询自动刷新

使用方式如下

```ts
function createStateManager() {
    return newTypedConfiguration()
        .assocaitionProperties("BookStore", "books", {
            contains: ...,
            position: ...,
            dependencies: (
                variables?: BookStoreArgs["books"]
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

## 调整分页结果和"associationProperties.range"

上文提到，未被直接修改的子关联有可能被框架自动修改，tryLink行为可能插入新的数据，tryUnlink行为可能删除已有数据。这种情况下，分页结果将会被破坏，可能会影响后续翻页操作。

有两种情况，需要调整分页结果

- Connection类型中有表示分页前记录总条数的字段，比如附带例子中的totalCount字段
- 分页是基于行数偏移量的分页，而非基于对象id

associationProperties对象接受一个range函数来调整分页结果，其定义如下

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
  - range: 分页范围，你需要在函数中修改此对象
    - endCursor: 结束游标
    - 其它任何字段，当然包含可能存在的字段"totalCount"
  - delta
    记录行数的变化量，正数表示新的数据被添加到当前关联中；负数表示有数据从当前关联中被移除
  - direction: 分页方向，forward或backward
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

第一点的反例：假设有一个查询字段Query.findActiveUsers(), 虽然此关联没有任何参数，但是故名思义，它隐含了过滤逻辑。此关联仅代表active为true的数据，而非所有数据。

第二点的反例：假设有一个查询字段Query.findRows(orderFieldName: string, descending: boolean), 这两个参数仅用于动态排序，没有过滤数据的意图，无论它们被如何指定，此关联都能代表所有数据。

稍后的版本会处理这两种情况。在此之前，希望能听听大家的意见

--------------------------------

[< 上一篇: useMutation](./useMutation_zh_CN.md) | [返回上级：变更](./README_zh_CN.md) | [下一篇：双向关联 >](./bidirectional-association_zh_CN.md)
