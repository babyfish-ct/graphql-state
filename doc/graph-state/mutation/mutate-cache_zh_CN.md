# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../../README_zh_CN.md)/[图状态](../README.md)/[变更](./README_zh_CN.md)/变更缓存

要变更缓存，首选需要获取StateManager，请使用被生成代码中的useTypedStateManager函数

```
import { FC, memo } form 'react';
import { useTypedStateManager } from './__generated';

export const SomeComponent: FC = memo(() => {

    const stateManager = useTypedStateManager();
    
    ... more code ...
});
```

## 1. 保存

StateManager支持save函数用于保存数据，它合并了insert和update操作，你不用区分insert和update

> 注意：
> 
> 1. 为了简化例子，后续所有代码都隐了这些import语句
>   ```
>   import { book$, book$$, bookStore$$, author$, author$$ } from './__generated/fetchers';
>   ```
> 2. 后续代码硬编码了大量的JSON字面量。在实际项目中，不可能对需要保存数据的JSON进行硬编码，而本文档如此只是为了简化讨论
> 
> 3. save函数的第一个参数是[graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)的fetcher，第二个参数是要保存的对象图或对象图集合，第三个参数可选的fetcher参数。由于[graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)的类型安全性，如果第二个和第三个参数如果出现任何拼写错误，将会在编译期报错。

### 1.1 保存简单对象
```

stateManager.save(

    book$$,
    
    { id: "e110c564-23cc-4811-9e81-d587a13db634", name: "Learning GraphQL" }
);
```

### 1.1 保存使用字段别名的对象
```
stateManager.save(
    
    book$
    ["id+"](options => options.alias("bookId"))
    ["name+"](options => options.alias("bookName")),
    
    { bookId: "e110c564-23cc-4811-9e81-d587a13db634", bookName: "Learning GraphQL" }
);
```

### 1.2 保存带关联的对象
```
stateManager.save(
    
    book$$
    .store(bookStore$$)
    .authors(author$$),
    
    { 
        id: "e110c564-23cc-4811-9e81-d587a13db634", 
        name: "Learning GraphQL",
        store: {id: "d38c10da-6be8-4924-b9b9-5e81899612a0", name: "O'REILLY"},
        authors: [
            {id: "fd6bb6cf-336d-416c-8005-1ae11a6694b5", name: "Eve Procello"},
            {id: "1e93da94-af84-44f4-82d1-d8a9fd52ea94", name: "Alex Banks"}
        ]
    }
);
```

### 1.3 保存带参数的对象（参数化的关联）

最直观，但是不推荐的方式
```
stateManager.save(
    
    book$$
    .store(bookStore$$)
    .authors(
        { name: "eve" }
        author$$
    ),
    
    { 
        id: "e110c564-23cc-4811-9e81-d587a13db634", 
        name: "Learning GraphQL",
        store: {id: "d38c10da-6be8-4924-b9b9-5e81899612a0", name: "O'REILLY"},
        authors: [
            {id: "fd6bb6cf-336d-416c-8005-1ae11a6694b5", name: "Eve Procello"}
        ]
    }
);
```
更推荐的方式
```
stateManager.save(
    
    book$$
    .store(bookStore$$)
    .authors(
        { name: ParameterRef.of("authorName") }
        author$$
    ),
    
    { 
        id: "e110c564-23cc-4811-9e81-d587a13db634", 
        name: "Learning GraphQL",
        store: {id: "d38c10da-6be8-4924-b9b9-5e81899612a0", name: "O'REILLY"},
        authors: [
            {id: "fd6bb6cf-336d-416c-8005-1ae11a6694b5", name: "Eve Procello"}
        ]
    },
    
    { authorName: "eve" }
);
```

> **注意**
> 
> 这个例子保存的关联不是Book.authors，而是Book.authors({name: "eve"})
> 
> 这是一个参数化的关联。所以仅仅传递数据对象是不够的。此例很好地解释了为什么save函数的第一个参数要指定[graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)的fetcher。


### 1.5 保存多个对象

```
stateManager.save(
    book$$
    .authors(
        author$.id
    ),
    [
        { 
            id: "e110c564-23cc-4811-9e81-d587a13db634", 
            name: "Learning GraphQL",
            authors: [
                {id: "fd6bb6cf-336d-416c-8005-1ae11a6694b5"},
                {id: "1e93da94-af84-44f4-82d1-d8a9fd52ea94"}
            ]
        },
        {
            id:"8f30bc8a-49f9-481d-beca-5fe2d147c831",
            name:"Effective TypeScript",
            authors: [
                { id: "c14665c8-c689-4ac7-b8cc-6f065b8d835d" }
            ]
        }
    ]
);
```

> **注意**
> 
> 在这个例子中，在关系属性authors中，对Author对象只保存其id字段。这表示，不想修改Author对象的任何字段，只想修改Book和Author之间的关系

## 2. 删除

### 2.1 删除对象
```
stateManager.delete("Book", "e110c564-23cc-4811-9e81-d587a13db634");
```
> API是强类型的，不用担心字符串"Book"拼写错误

### 2.2 删除多个对象
```
stateManager.delete(
    "Book", [
        "e110c564-23cc-4811-9e81-d587a13db634",
        "8f30bc8a-49f9-481d-beca-5fe2d147c831"
    ]);
```
> API是强类型的，不用担心字符串"Book"拼写错误

-----------------------
[返回上级：变更](./README_zh_CN.md) | [下一篇：useMutation >](./useMutation_zh_CN.md)
