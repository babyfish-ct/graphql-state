# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/[图状态](../README_zh_CN.md)/[变更](./README.md)/智能变更

智能更新更新流程如下

![image](../../../smart-mutation_zh_CN.png "smart mutation")

此图图在首页中已经讨论过了，这里不再赘述。

本文档重点讨论两点：

- 框架如何抉择只需修改本地数据还是需要重新查询?
- 如果用户愿意介入抉择过程，他应该如何参与优化?

## 1. 基本概念

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
```
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
            {id: id3 }, 
            {id: id4 }, 
            {id: id5 },
            {id: id6 },
            {id: id7 }
        ]
    }
    
    { bookName: "a" }
)
```
这段代码试图修改id为storeId的BookStore对象的子关联books({name: "a"})

假如books({name: "a"})现在的旧值为[id1, id2, id3, id4, id5]，而期望修改的新值为[id3, id4, id5, id6, id7]。对比新旧数据，被删除的book为[id1, id2]，被添加的书为[id6, id7]。

当前BookStore对象，除了具备当前的books({name: "a})这个子关联外，还有另外两个子同族的子关联books({})，books({name: "b"})，接下来，框架即将尝试
```
books({}).tryUnlink({
    ids: [id1, id2], 
    reason: {name: "a}
});
books({}).tryLink({
    ids: [id6, id7], 
    reason: {name: "a}
});
books({name: "b"}).tryUnlink({
    ids: [id1, id2], 
    reason: {name: "a}
});
books({name: "b"}).tryLink({
    ids: [id6, id7], 
    reason: {name: "a}
});
```
这说明，books({name: "a"})的变化有可能对books()和books({name: "b"})形成影响。即

> 同族内的子关联之间会相互影响; 任何一个被修改，其余的都会被执行unlink或link操作

### 1.3. Variables contains

为了更好地判断是否可以直接修改缓存，引入了一个概念variables contains，判断查询参数之间的包含关系
```
contains(variables1, variables2): boolean
```
改方法件判断variables1是否包含variables2，即variables2的所有字段都在variables1中存在且它们的值相等
|Expression|Result|
|--------|--------|
|contains({k1: 'A', k2: 'B'}, {k1: 'A'})|true|
|contains({k1: 'A'}, {k1: 'A', k2: 'B'})|false|
|||
|contains({name: "a"}, {name: "a")|true|
|||
|contains({name: "a"}, {name: "b")|false|
|contains({name: "b"}, {name: "a")|false|
|||
|contains({name: "a"}, udefined)|true|
|contains(undefined, {name: "a"})|false|
|||
|contains(undefined, udefined)|true|

借助辅助这个函数，tryUnlink的实现如下
```
tryUnlink(oldIds: ReadonlyArray<any>, reason: any) {
    for (const oldId of oldIds) {
        tryUnlinkOne(oldId, reason)
    }
}

tryUnlinkOne(oldId: any, reason: any) {
    if (!this.ids.contains(oldId)) {
        return; //当前子关联并没有oldId, 不需要做任何事
    }
    if (contains(this.variables, reason)) {
        this.remove(oldId); //条件比我宽松的子关联都同意删除旧元素了，我当然同意
        return;
    }
    ... 更多的代码 需要进一步判断 ....
}
```
因为conains({name: "a"}, {})，所以，
如果一个元素从books({})中被删除，那么它一定能直接从books({name: "a"})被删除。
很遗憾，上文的案例并没有命中这种情况

tryLink的实现如下
```
tryUnlink(newIds: ReadonlyArray<any>, reason: any) {
    for (const oldId of oldIds) {
        tryUnlinkOne(oldId, reason)
    }
}

tryUnlinkOne(oldId: any, reason: any) {
    if (!this.ids.contains(oldId)) {
        return; //当前子关联并没有oldId, 不需要做任何事
    }
    if (contains(reason, this.variables)) {
        this.remove(oldId); //条件比我严格的子关联同意添加新元素了，我当然同意
    }
    ... 更多的代码 需要进一步判断 ....
}
```

经过此variables contains的优化，上个章节的行为变成了
> 暂时
<table>
    <thead>
        <tr>
            <th>期望行为<th>
            <th>判断结果</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
<pre>books({}).tryUnlink({
    ids: [id1, id2], 
    reason: {name: "a}
});</pre>
            </td>
            <td></td>
        </tr>
        <tr>
            <td>
<pre>books({}).tryLink({
    ids: [id6, id7], 
    reason: {name: "a}
});</pre>
            </td>
            <td></td>
        </tr>
        <tr>
            <td>
<pre>books({name: "b"}).tryUnlink({
    ids: [id1, id2], 
    reason: {name: "a}
});</pre>
            </td>
            <td></td>
        </tr>
        <tr>
            <td>
<pre>books({name: "b"}).tryLink({
    ids: [id6, id7], 
    reason: {name: "a}
});</pre>
            </td>
            <td></td>
        </tr>
    </tbody>
</table>

--------------------------------

[< 上一篇: useMutation](./useMutation_zh_CN.md) | [返回上级：变更](./README_zh_CN.md) | [下一篇：双向关联](./bidirectional-association_zh_CN.md)
