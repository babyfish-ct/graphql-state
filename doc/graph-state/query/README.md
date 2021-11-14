# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../../README.md)/[图状态](../README.md)/查询

本框架支持四个函数，用于从缓存或服务端查询数据

- useQuery
- usePaginationQuery
- useObject
- useObjects

它们的导入方式不同

1. useQuery和usePaginationQuery从'graphql-state'中直接导入
```ts
import { useQuery, usePaginationQuery } from 'graphql-state';
```

2. useObject和useObjects从生成的代码中导入
```ts
import { useObject, useObjects } from '../__generated';
```

## 下级文档

- [useQuery](./useQuery.md)
- [usePaginationQuery](./usePaginationQuery.md)
- [useObject&useObjects](./useObject.md)

---------------
[< Previous: State Manager](../state-manager.md) | [Back to parent: 图状态](../README.md) | [Next: 变更 >](../mutation/README.md)