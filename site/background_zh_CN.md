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
        findBooks({"name": "g"}): [] // 额外修改：旧的数据引用需要消失
    },
    "Book:2": {
        id: 2,
        name: "Learning TypeScript" // 主修改：开发人员的原始意图
    },
    "Book:3": {
        id: 3,
        name: "Effective TypeScript"
    }
}
```
> 上面的"主修改"很简单，这本身就是开发人员的意图。但是，"额外修改"就很麻烦了，是缓存中其它已有数据为了适应新的数据修改，而不得不做出的变化
> 
> 这样的"额外修改"的数量，受缓存中现有数据的多少和数据结构复杂度的影响。从理论层面讲，复杂度无法限制，一个主修改可以会导致无数个额外修改。

要让缓存完成上面的"额外修改"，无外乎两种办法。

- 手动更改本地缓存，这是性能优越但不一定可行的方法
- 让查询 *Query.findBooks({name: "g"})* 重新从服务端获取最新数据。这是性能不好但一定可行的方法

- 对Apollo Client而言：
  - 修改缓存：https://www.apollographql.com/docs/react/data/mutations/#updating-the-cache-directly
  - 重新查询：https://www.apollographql.com/docs/react/data/mutations/#refetching-queries
- 而Relay更主张直接修改缓存：https://relay.dev/docs/guided-tour/updating-data/graphql-mutations/#updater-functions

上文阐述过，这种"额外修改"的复杂度，是无法限制的。可以预见的是，如果UI模块越多，模块内部的数据类型越丰富，数据类型之间的关系越复杂，那么，保证缓存一致性就越困难。
- 如果你选择直接修改缓存，你需要编写的代码的逻辑会越来越复杂。
- 如果你选择让某些查询重新获取数据，判断哪些查询会被当前修改操作影响而需要重新获取，同样是一件困难的事。

总之
> 一个主修改导致**N**个额外修改

UI越复杂，N就越大，这是Apollo Client和Relay最大的问题。如果你使用了它们，你会发现你面对的痛点变成了缓存一致性维护，痛的程度和UI的复杂度正相关。

## 4. 第四个层次，自动保证缓存的一致性

该框架能够在修改后自动保证缓存的一致性，用户只需把主要修改保存到缓存中, 所有的额外修改都会被框架自动处理。

优先采用直接修改缓存的方式，如果不行就升级为重新查询的方式。无论框架如何抉择，这一切都是自动化的。

-----------------

[回到首页](../README_zh_CN.md)
