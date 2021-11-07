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

## 1. 插入或更新

为了简化例子，此章节的所有代码都需包含
```
import { book$, book$$, bookStore$$ } from './__generated/fetchers';
```

### 1.1 Save simplest object
```

stateManager.save(
    book$$,
    { id: "e110c564-23cc-4811-9e81-d587a13db634", name: "Learning GraphQL" }
);
```

### 1.1 Save object with GraphQL field alias
```
stateManager.save(
    
    book$
    ["id+"](options => options.alias("bookId"))
    ["name+"](options => options.alias("bookName")),
    
    { bookId: "e110c564-23cc-4811-9e81-d587a13db634", bookName: "Learning GraphQL" }
);
```

### 1.2 Save object with associations
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

### 1.3 Save object with variables(parameterized assocaition)

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

### 1.5 Save multiple objects

stateManager.save(
    book$$,
    [
        { id: "e110c564-23cc-4811-9e81-d587a13db634", name: "Learning GraphQL" },
        {"id":"8f30bc8a-49f9-481d-beca-5fe2d147c831","name":"Effective TypeScript"}
    ]
);

> 注意：
>
> 在实际项目中，不可能对需要保存数据的JSON进行硬编码。本文档如此只是为了简化讨论

## 2. 删除

-----------------------
[返回上级：变更](./README_zh_CN.md) | [下一篇：useMutation >](./useMutation_zh_CN.md)
