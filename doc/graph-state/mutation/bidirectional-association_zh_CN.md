# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../../README_zh_CN.md)/[图状态](../README_zh_CN.md)/[变更](./README_zh_CN.md)/双向关联


参考这样一个例子

BookStore具备一个books属性，一个指向Book的one-to-many关联
反过来，Book具备一个store属性，一个指向BookStore的many-to-one关联
从业务上讲，BookStore.books和Book.store其实是同一个关联因视角不同而展现出的两面，因此，graphql-state允许你把这样的两个关系绑定为双向关联。一旦你完成了这种绑定，你就可以得到如下GIF动画所示的效果

![image](../../../bidirectional-association.gif "双向关联")

在这个例子中，你执行的修改行为是
```
MANNING.books.add(LearningGraphQL);
```
与此同时，graphql-state会为你执行两个自动更新
```
O'REILLY.books.remove(LearningGraphQL);
LearningGraphQL.store = MANNING;
```

> 上面的GIF演示中，我是通过修改BookStore对象来完成演示的。
> 事实上，对双向关联而言，无论操作哪一端都是可行的，你也可以编辑Book对象来达到完全一样的效果，附带的例子运行起来后，你体验到更多的双向关联相关的效果。

## 实现方法

双向关联维护的实现方法很简单，由于双向关联是一种业务意义层面的绑定，GraphQL schema中并没有对等的元数据，因此我们需要在配置阶段加入双向关联的元数据即可

```ts
import { newTypedConfiguration } from "./__generated";

function createStateManager() {
    return new TypedConfiguration()
        .bidirectionalAssociation("BookStore", "books", "store") // BookStore.books <---> Book.store
        .bidirectionalAssociation("Book", "authors", "books") // Book.authors <---> Author.books
        .network(...)
        .buildStateManager();
}
```
上面的写法并不是唯一的写法，下面这种写法与之等价
```ts
import { newTypedConfiguration } from "./__generated";

function createStateManager() {
    return new TypedConfiguration()
        .bidirectionalAssociation("Book", "store", "books") // Book.store <---> BookStore.books
        .bidirectionalAssociation("Author", "books", "authors") // Author.books <---> Book.authors 
        .network(...)
        .buildStateManager();
}
```

> API是强类型的，不用担心上面的字符串参数出现拼写错误，错误会在编译时报告

-----------

[< 上一篇：智能变更](./smart-mutation_zh_CN.md) | [返回上级：变更](./README_zh_CN.md) 
