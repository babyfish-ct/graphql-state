# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../../README.md)/[Graph state](../README.md)/[Mutation](./README.md)/Bidirectional association


Refer to such an example

- "BookStore" has a "books" field, a one-to-many association pointing to "Book"
- In turn, "Book" has a "store" field, a many-to-one association pointing to "BookStore"

From a business perspective, "BookStore.books" and "Book.store" are actually two sides of the same association due to different perspectives. Therefore, graphql-state allows you to bind these two associations into one bidirectional association. Once you have completed this binding, you can get the effect shown in the following GIF animation

|![image](../../../bidirectional-association.gif "Bidirectional assocaition")|
|----|

In this example, the modification you performed is
```
MANNING.books.add(LearningGraphQL);
```
At the same time, graphql-state will perform two automatic updates for you
```
if (cached(O'REILLY.books)) {
    O'REILLY.books.remove(LearningGraphQL);
}
if (cached(LearningGraphQL.store)) {
    LearningGraphQL.store = MANNING;
}
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

[< Previous: 智能变更](./smart-mutation.md) | [Back to parent: 变更](./README.md) 
