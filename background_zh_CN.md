# 本框架的核心价值是什么，为什么要创建它？


本框架的目的是提供远比[Apollo client](https://github.com/apollographql/apollo-client)和[Relay](https://github.com/facebook/relay)智能的服务

如何在react中消费GraphQL服务，可以分为四个层次

## 1. 第一个层次，提供API和服务端交互。
这个层次的框架以[https://github.com/prisma-labs/graphql-request](https://github.com/prisma-labs/graphql-request)为代表。

这类框架是最基本的最简单的GraphQL客户端，可以使用其API和服务端交互，但没有任何缓存相关的服务。

当你的应用很简单的时候，最小化的功能可以带来最简单的学习难度和使用成本。项目很简单的情况下，每个页面都是数据量很小的信息孤岛，你完全可以通过频繁刷新请求来应对缓存的缺失。

然而，当你遇到稍微复杂度点的应用，多种不同的数据同时呈现在相对复杂的界面上，而且它们之间还存在彼此关联和依赖，你会开始力不从心，因为你不可能置性能于不顾，频繁地刷新所有数据。你迫切需要缓存。

## 2. 第二个层次，简单的key-value缓存
这个层次的框架以[https://github.com/tannerlinsley/react-query](https://github.com/tannerlinsley/react-query)为代表。

诚然，react-query在可配置性方面做得非常强大；但是是最大的问题是，缓存是简单的key/value缓存。而事实上，真正的数据模型是图结构的，不同的对象之间会有相互关联。例如
```
BookStore <--1:n--> Book <--m:n--> Author
``
按照例子中的关联方式，简单的key/value缓存会轻易导致如下两条数据

缓存数据1:
```
{
  __typename: "BookStore",
  id: 1,
  name: "O'REILLY",
  books: [
     {
         __typename: "Book",
         id: 2,
         name: "Learning GraphQL",
     },
     {
         __typename: "Book",
         id: 3,
         name: "Effective TypeScript"
     }
  ]
}
```
缓存数据2:
```
{
  __typename: "Author",
  id: 9,
  name: "Alex Banks",
  books: [
     {
         __typename: "Book",
         id: 2,
         name: "Learning GraphQL",
     }
  ]
}
```
在上面的数据中，名称为"Learning GraphQL"的书籍在两个缓存数据中都存在，这种冗余，会在后续数据变更中导致数据不一致问题。

随着对象之间的关系越来越复杂，你会发现要消除冗余带来的副作用越来越困难。你迫切需要将缓存中的数据进行范式化处理，就如同你在关系型数据库中所做的那样。

## 3. 第三个层次，normalized-cache
这个层次的框架以Apollo Client和Relay为代表。

Apollo Client: [https://github.com/apollographql/apollo-client](https://github.com/apollographql/apollo-client)(从3.0开始支持normalized cache，更旧的版本不支持)
Relay: [https://github.com/facebook/relay](https://github.com/facebook/relay)

nomalized-cache就像关系型数据一样存储数据行以及它们之间的关系，高度范式化的数据是没有冗余的。当然，这种内部关系型数据需要和用户使用的层次化数据进行彼此转换，幸运的是，框架很容易将这种转换自动化黑盒化，用户感知不到内部关系型数据的存在。

现在，用户不用担心缓存存在数据冗余了。但是还有一种严重的问题，就是修改操作会非常复杂，需要开发人员维护缓存的一致性。

比如，现有缓存内部的数据如下
```
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
其中, *findBooks({"name": ...})*表示查询条件，对书的名称进行模糊匹配筛选。

现在，修改数据，把*{id:2, name: "Learning GraphQL"}*修改为*{id:2, name: "Learning TypeScript"}*。修改后，新的名称*"Learning TypeScript"*不再和查询条件*{name: "g"}*匹配。所以，新的缓存看起来应该如此

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
> 上面的"主修改"很简单，这本身就是开发人员的意图。但是，"额外修改"就很麻烦了，是缓存中其它已有数据为了适应新的数据修改，而不得不做出的变化
> 
> 这样的"额外修改"的数量，受缓存中现有数据的多少和数据结构复杂度的影响。从理论层面讲，复杂度无法限制，一个主修改可以会导致无数个额外修改。

要让缓存完成上面的"额外修改"，无外乎两种办法。

- 手动更改本地缓存，这是性能优越但不一定可行的方法
- 让查询*Query.findBooks({name: "g"})*重新从服务端获取最新数据。这是性能不好但一定可行的方法

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

4. 第四个层次，自动保证缓存的一致性

该框架能够在修改后自动保证缓存的一致性，用户只需把主要修改保存到缓存中, 所有的额外修改都会被框架自动处理。

优先采用直接修改缓存的方式，如果不行就升级为重新查询的方式。无论框架如何抉择，这一切都是自动化的。

-----------------

[回到首页](./README_zh_CN.md)
