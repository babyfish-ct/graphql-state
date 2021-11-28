# 系统功能和GIF动画演示

![image](./architecture_zh_CN.png "系统功能")

## 1. 简单状态
一套看起来非常类似于[recoil](https://github.com/facebookexperimental/Recoil)的状态管理，用于管理业务对象模型以外的零散数据，可以方便地和图状态配合。

## 2. 图状态

本框架的核心价值，本框架的目的是提供远比[Apollo client](https://github.com/apollographql/apollo-client)和[Relay](https://github.com/facebook/relay)智能的服务。这也是我创建此框架的动机。

> **在mutation后，除了需要使用简单的API将直接修改的数据保存到缓存中外，既无需编写复杂代码更新本地缓存中其他受影响的数据，也无需指定哪些查询需要刷新，一切都是自动的。**

图状态管理支持两个核心功能。

### 2.1. 智能更新

在使用传统的GraphQL客户端时，开发者面临的最大痛苦，是需要在变更操作后决定究竟应该更新本地缓存还是重新查询数据。如果选择修改本地缓存，将面临繁重的工作量；如果选择重新查询，不仅需要接受性能缺陷，而且确定哪些查询需要被重新执行也非易事。

这个框架内置的缓存数据库是高度智能的。你只需要简单地用服务端的返回信息去更新它，它就会分析新数据对现有缓存的影响程度，尽量争取只修改本地缓存；如果这种努力不可行，当前操作就会被自动升级为重新查询行为并自动找出所有需要被重新执行的查询。

![image](./smart-mutation_zh_CN.png "智能更新")

无论框架是选择仅修改本地数据这个更好的策略(A)，还是重新查询这个不太好的策略(B)。它们都是全自动的，不需要您的干预。

然而，如果你愿意的话，你也可以干预抉择过程。您可以使用简单的API来帮助它优化，增加情况(A)的发生概率并降低情况(B)的发生概率。

#### 2.1.1. 用户不给予优化时

让我们来看一个因用户不给予优化而导致无法通过仅修改本地缓存来完成变更的例子，GIF动画如下

|![image](./unoptimized-mutation.gif "用户不给予优化时")|
|---|

当我们把"MANNING-1"修改成"MANNING-2"的时候，在缺少用户优化的情况下，带参数的两个缓存项被清除。所以，带参数的查询会自动从服务端重新获取新的数据。

#### 2.1.2. 用户给予优化时

让我们来看一个因用户优化的支持而无需重新查询仅需修改本地缓存就可以完成变更的例子，GIF动画如下

|![image](./optimized-mutation.gif "用户给予优化时")|
|---|

当我们把"MANNING-1"修改成"MANNING-2"的时候，在用户优化的支持下，带参数的两个缓存项被直接更新，而不是被清除。所以，带参数的查询会马上呈现了最新结果，无需重新查询。

> 注意，这里涉及到了3个缓存项
> 
> - Query.findBooksStores()
> - Query.findBooksStores({name: "1"})
> - Query.findBooksStores({name: "2"})
> 
> 实际项目中，被UI抛弃的数据可能会在较短时间内被垃圾回收系统释放。在这个例子中，为了达到演示效果，故意调整了垃圾释放策略，让这三个数据都可以相对长时间地在缓存中同时存在。

#### 2.1.3. 智能排序

如上面的GIF动画所示，graphql-state能自动根据数据的变更重新实施条件筛选。不仅如此，graphql-state还能自动根据数据的变更重新实施排序，如下GIF动画所示

|![image](./smart-sorting.gif "智能排序")|
|---|

本例中我们关心两个关联
- Query.findBooks
- BookStore.books

这两个关联都按照name升序排序。所以，当对象的name被修改时，这两个关联都会被重新排序。

> 智能排序依赖于用户优化

### 2.2. 双向关联管理

上文中，我们展示几个很酷的效果。不仅如此，graphql-state还能处理不同数据关联之间的相互影响。这就是双向关联维护。

参考这样一个例子
- BookStore具备一个books属性，一个指向Book的one-to-many关联
- 反过来，Book具备一个store属性，一个指向BookStore的many-to-one关联

从业务上讲，BookStore.books和Book.store其实是同一个关联因视角不同而展现出的两面，因此，graphql-state允许你把这样的两个关系绑定为双向关联。一旦你完成了这种绑定，你就可以得到如下GIF动画所示的效果

|![image](./bidirectional-association.gif "双向关联")|
|---|

在这个例子中，你执行的修改行为是
```
MANNING.books.add(LearningGraphQL);
```
与此同时，graphql-state会为你执行两个自动更新
```
if (cached(O'REILLY.books)) {
    O'REILLY.books.remove(LearningGraphQL);
}
if (cached(LearningGraphQL.store)) {
    LearningGraphQL.store = MANNING;
}
```

### 2.3. 数据库风格的触发器

内置缓存数据库支持触发器。不仅框架内部使用它来实现数据智能维护，触发器也作为公共API暴露出来，让开发者可以自定义更多的智能行为。

### 2.4. 访问REST服务

对于现有的REST服务，框架支持在客户端将REST服务映射为GraphQL服务，以GraphQL的语义使用，并享受[graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)提供的语法糖

## 3. HTTP优化

框架内置优化策略，减少HTTP请求次数

1. 削峰：用户可以快速改变查询条件，但异步请求会尽可能慢地发出。系统保证最后一次HTTP请求使用的是用户上次输入的参数。

2. 基于id/ids的object/objects查询很容易在不同的UI组件之间重复，如果不优化，会导致HTTP请求碎片化。只要不同的组件以相同的shape查询一个/多个对象，就会将不同组件指定的id/ids参数合并在一起，最后发送一个合并的批处理请求。

3. 对于变量相同但形状不同的多个查询，形状较小的查询不会发出HTTP请求，它们会借用形状最大的查询的HTTP请求来共享响应数据。即使对于最大shape的查询的HTTP请求已经发送并且处于pending状态，这种优化仍然有效。 

--------------
[回到首页](../README_zh_CN.md)

