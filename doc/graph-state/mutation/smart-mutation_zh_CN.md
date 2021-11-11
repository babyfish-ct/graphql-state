# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/[图状态](../README_zh_CN.md)/[变更](./README.md)/智能变更

智能更新更新流程如下

![image](../../../smart-mutation_zh_CN.png "smart mutation")

此图图在首页中已经讨论过了，这里不再赘述。

本文档重点讨论两点：

- 框架如何抉择只需修改本地数据还是需要重新查询?
- 如果用户愿意介入抉择过程，他应该如何参与优化?

## 1. 关联被修改

### 1.1. 关联族和子关联

在GraphQL中，关联是具备参数的，以[附带例子的服务端](https://github.com/babyfish-ct/graphql-state/tree/master/example/server)为例，其提供的服务定义如下

```
type Query {
    findBookStores(name: String): [BookStore!]!
    ...
}
type BookStore {
    books(name: String): [Book!]!
    ...
}
...
```

我们看到，Query.findBookStores和Book.authors都是参数化的。统一个关系，可以由不同参数的创建不同的实例，比如

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

如上图，我们有两个关联族，每个族中有三个子关联

### 1.2. link和unlink

清观察下面的代码
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

假设books({name: "a"})现在的旧值为[id1, id2]，而期望修改的新值为[id2, id3]。对比新旧数据，被删除的book为[id1]，被添加的书为[id3]。

当前BookStore对象，除了具备当前的books({name: "a})这个子关联外，还有另外两个子同族的子关联books({})，books({name: "b"})，接下来，框架即将尝试
```ts
books({}).tryUnlink({
    id: id1, 
    reason: {name: "a}
});
books({}).tryLink({
    id: id3, 
    reason: {name: "a}
});
books({name: "b"}).tryUnlink({
    id: id1, 
    reason: {name: "a}
});
books({name: "b"}).tryLink({
    id: id3, 
    reason: {name: "a}
});
```
这说明，books({name: "a"})的变化有可能对books()和books({name: "b"})形成影响。即

> 同族内的子关联之间会相互影响; 任何一个被修改，其余的都会被执行unlink或link操作

### 1.3. containsVariables

为了更好地判断是否可以直接修改缓存，引入了一个概念variables contains，判断查询参数之间的包含关系
```ts
containsVariables(variables1, variables2): boolean
```
改方法件判断variables1是否包含variables2，即variables2的所有字段都在variables1中存在且它们的值相等
|Expression|Result|
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

借助辅助这个函数，tryUnlink的逻辑如下
```ts
tryUnlink(oldId, reason) {
    if (!this.ids.contains(oldId)) {
        return; //要删除的数据早已不存在, 不需要做任何事
    }
    if (containsVariables(this.variables, reason)) {
        this.unlinkDirectly(oldId); 
        return; //条件比我宽松的子关联都同意删除旧元素了，我当然同意
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
        this.linkDirectly(newId); 
        return; //条件比我严格的子关联同意添加新元素了，我当然同意
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
                contains({name: "a"}, {})为true，
                既比当前子关联条件更严苛的其它同族子关联books({name: "a"})都同意接受新元素了，books({})当然也同意，此修改可以直接在本地缓存上之执行
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

### 1.4. 默认优化器和用户优化器

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

> 注意：API是强类型设计，不用担心"findBookStores", "BookStore"和"authors"等字符串的拼写错误，错误会在编译时呈现。

这里，我们以assocaitionProperties来讲解如何优化BookStore.books
> 为了清晰讲解，这里写出了所有类型，并未有任何省略，你在开发中可以省略。

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
                    return true; 
                }
                if (row.has("name")) { // 如果name被缓存，检查之
                    return row.get("name").toLowerCase()
                        .indexOf(variables.name.toLowerCase()) !== -1;
                }
                return undefined; // 如果name没有被缓存，不知道该如何优化
            }
        })
        .network(...)
        .buildStateManager();
}
```

这里
- 先检查子关联的参数是否指定了name，如果没有，直接判定接受元素属于关联
- 如果对象的name被缓存了，检查对象的name是否包含参数的name，并返回检查结果
- 如果对象的name没有被缓存，没有任何办法优化，返回undefine即可

> 注意：
> 
> 此处只需判断variables?.name是否为undefined，不用考虑null和""
> - null会被自动转化为undefined
> - 如果参数为""，但GraphQL schema并没有定义改参数不能为空，自动转化为undefined

这个优化是可选的，如果用户没有指定，框架默认的的contains行为如下
```ts
function defaultContains(
    row: FlatRow<BookFlatType>,
    variables?: BookStoreArgs["books"]
) => boolean | undefined {
    if (variables?.name === undefined) {
        return true; 
    }
    return undefined; 
}
```
即便是框架默认的优化器，对没有参数的子关联也是很友好的。

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
                        <div>如果用户不参与优化</div>
                        不做任何操作，旧对象不应该被移除
                        <div><i>
                            这是没问题的，如果对象在books({name: "a"})中的消失是是因为其它原因导致的
                            (比如，删除操作，或其父对象发生变更)，其它智能更新机制会负责删除它。
                        </i></div>
                    </li>
                    <li>
                        <div>如果用户参与优化</div>
                        不做任何操作，旧对象不应该被移除（对于无参数子关联，上文中的用户行为和框架行为一致）
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
                        <div>如果用户不参与优化</div>
                        <div>缓存中数据作废，所有受此关联相关的UI查询自动刷新</div>
                    </li>
                    <li>
                        <div>如果用户参与优化</div>
                        检查用户实现的contains函数的返回值
                        <ul>
                            <li>true: 不做任何操作</li>
                            <li>false: 从当前子关联删除元素</li>
                            <li>undefined: 用户也无法判断。缓存中数据作废，所有受此关联相关的UI查询自动刷新</li>
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
                        <div>如果用户不参与优化</div>
                        <div>缓存中数据作废，所有受此关联相关的UI查询自动刷新</div>
                    </li>
                    <li>
                        <div>如果用户参与优化</div>
                        检查用户实现的contains函数的返回值
                        <ul>
                            <li>true: 为当前子关联添加新元素</li>
                            <li>false: 不做任何操作</li>
                            <li>undefined: 用户也无法判断。缓存中数据作废，所有受此关联相关的UI查询自动刷新</li>
                        </ul>
                    </li>
                </ul>
            </td>
        </tr>
    </tbody>
</table>

## 2. 对象被插入位置

### 2.1. position决策

由于各种原因，会导致对象被自动插入到并未被直接修改的集合关联中，这时我们决定其插入位置呢？关联是否有业务层面的排序呢？

在[配套例子中](https://github.com/babyfish-ct/graphql-state/tree/master/example/client/src/graph/graphql)，所有关联数据是按照对象的name字段排序的。

关联优化器支持一个position函数，我们可以这样来为被自动插入的对象自定义插入位置

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
                        if (!rows[i].has("name")) { // if name of existing row is not cached
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

这里，position函数为新对象指定插入位置
参数:
- row: 即将被插入的新元素
- rows: 现在已经存在的数据
- paginationDirection:
  - forward: 当前connection关联使用了forward模式的分页
  - backward: 当前connection关联使用了backward模式的分页
  - undefined: 当前connection关联并未使用分页
  
  > paginationDirection不可能是"page"，page模式的分页无法进行优化以尝试判断其变更是否仅需要修改本地缓存
  
- variables: 查询参数

返回值：
  - 数字：
    - 如果 <= 0, 插入到头部
    - 如果 >= rows.length, 插入到尾部
    - 其它情况，插入到指定位置之前
  - start
    插入到头部
  - end
    插入到头部
  - undefined
    无法判断新对象应该插入到什么位置。缓存中数据作废，所有受此关联相关的UI查询自动刷新。
  > 注意
  > - 如果使用forward分页，如果新数据被定位到尾部，优化行为终止，缓存中数据作废，所有受此关联相关的UI查询自动刷新。 
  > - 如果使用backward分页，如果新数据被定位到头部，优化行为终止，缓存中数据作废，所有受此关联相关的UI查询自动刷新。

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

## 3. 对象内容被修改后

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

下面开看两个案例

1. 执行
```ts
stateManager.set(book$$, {id: "id1", 'effective typescript'});
```
很明显, "effective typescript" > Programming TypeScript, 因此业务上期望的效果是这样的
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
books({name: "typ"})的顺序发生了变化

2. 执行
```ts
stateManager.set(book$$, {id: "id1", 'Effective GraphQL'});
```
很明显, "Effective GraphQL"不在和查询条件{name: "typ"}匹配, 业务上期望的效果是这样的
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
比上个例子变化更大，被修改的数据所属于的关联变了。

如何让graphql-state实现上面这两个效果呢？

答案很简单，让graphql-state知道books({...})依赖于其对象的name字段即可，这样，被依赖的对象字段发生变更的时候，contains和position的策略有机会被重新执行一次

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

> 这里name字段用于排序，所以对name的字段的依赖是无条件的。
> 
> 假设name字段没有用于排序，仅仅用于按条件筛选，你可以使用如下代码
> ```
> if (variables.name !== undefined) {
>     return ["name"];
> }
> return [];
> ```


--------------------------------

[< 上一篇: useMutation](./useMutation_zh_CN.md) | [返回上级：变更](./README_zh_CN.md) | [下一篇：双向关联](./bidirectional-association_zh_CN.md)
