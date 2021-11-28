# 本框架的核心价值是什么，为什么要创建它？

## UI状态的本质
一个主变更导致**N**个额外变更。UI越复杂，**N**越大

## 为什么？

比如，现有缓存的数据如下
```ts
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
其中, *findBooks({"name": ...})* 表示查询条件，对书的名称进行模糊匹配筛选。

- 书名 *《Learning GraphQL》* 和 *《Effective TypeScript》* 都和过滤条件 *{"name": "e"}* 匹配，所以 *Query.findBooks({"name": "e"})* 包含 *"Book:2"* 和 *"Book:3"* 两本书籍
- 仅书名 *《Learning GraphQL》* 和过滤条件 *{"name": "g"}*配置，所以 *"Query.findBooks({"name": "g"})"* 仅包含 *"Book:2"* 一本书籍

现在，修改数据，把 *{id:2, name: "Learning GraphQL"}* 修改为 *{id:2, name: "Learning TypeScript"}* 。修改后，新的名称 *"Learning TypeScript"* 不再和查询条件 *{name: "g"}* 匹配。所以，新的缓存看起来应该如此
```ts
{
    "Query": {
    
        findBooks({"name": "e"}): [{ref: "Book:3"}, {ref: "Book:3"}],
        
        // 额外修改
        // 旧数据引用从'findBooks({"name": "g"})'消失
        // 因为新的书名《Learning TypeScript》不在和过滤器'{"name: g"}'匹配
        findBooks({"name": "g"}): [] // 额外修改：旧的数据引用需要消失
    },
    "Book:2": {
    
        id: 2,
        
        // 主修改：开发人员的原始意图
        name: "Learning TypeScript" 
    },
    "Book:3": {
        id: 3,
        name: "Effective TypeScript"
    }
}
```
> 上面的"主修改"很简单，这本身就是开发人员的意图。
> 
> 但是，"额外修改"就很麻烦了，是UI状态中其它已有数据为了适应新的数据修改而不得不做出的变化

要让缓存完成上面的"额外修改"，无外乎两种办法。

让我们来思考一些经典的案例（非全部）
1. 修改一个对象的某些字段，由于其他对象的关联集合可能含过滤条件，修改后的对象是否和这些过滤条件匹配？它是否有可能需要被添加到某些集合中？它是否有可能需要从某些集合中消失（上面的例子演示就是这种情况）？
2. 修改一个对象的某些字段，如果其他对象的关联集合在业务层面使用了这些字段排序，想关的这些集合是否应该被重新排序？
3. 插入一个对象的时候，它是否有可能需要被自动添加到其他对象的关联集合中。如果需要，添加到什么位置？
4. 把**A**对象添加到**B**对象的某个关联字段中，或者把**A**对象从**B**对象的某个关联字段中移除，如果**A**对象也有反向的关联字段引用B对象，这个反向的关联字段是否也需要被修改？

有很多类似的可能性，所以

> 一个主变更导致**N**个额外变更。UI越复杂，**N**越大

如果应用这些额外变更呢？两种方法

1. 手动更改本地缓存，这是性能优越但不一定可行的方法
2. 让查询 *Query.findBooks({name: "g"})* 重新从服务端获取最新数据。这是性能不好但一定可行的方法

这里，我们用[Apollo Client](https://github.com/apollographql/apollo-client)和[Relay](https://github.com/facebook/relay)来举例

- 对Apollo Client而言：
  - 修改缓存：https://www.apollographql.com/docs/react/data/mutations/#updating-the-cache-directly
  - 重新查询：https://www.apollographql.com/docs/react/data/mutations/#refetching-queries
- 而Relay更主张直接修改缓存：https://relay.dev/docs/guided-tour/updating-data/graphql-mutations/#updater-functions

但是在实际工作中，这是一个痛苦的工作

- 如果你选择直接修改缓存，你需要编写的代码的逻辑会越来越复杂。
- 如果你选择让某些查询重新获取数据，判断哪些查询会被当前修改操作影响而需要重新获取，同样是一件困难的事。

这是Apollo Client和Relay最大的问题，痛的程度和UI的复杂度正相关。

## 本框架的价值

这个框架让开发者只关注主变更，额外的变更会被自动处理。

相较于[Apollo Client](https://github.com/apollographql/apollo-client)和[Relay](https://github.com/facebook/relay)，变更后只需将主变更保存到本地缓存中。 既不需手动更改本地缓存中其他受影响的数据，也不需要指定哪些查询将受到影响并需要重新获取，因为所有额外变更都是自动处理的。

在框架内部，它会首先尝试通过修改本地缓存来应用额外变更，如果这不可行，它将自动确定哪些查询会受到影响并且必须重新获取。 无论框架如何选择，一切都是自动的。 

-----------------

[回到首页](../README_zh_CN.md)
