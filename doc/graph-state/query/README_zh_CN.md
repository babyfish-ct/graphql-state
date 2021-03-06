# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../../README_zh_CN.md)/[图状态](../README_zh_CN.md)/查询

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

- [useQuery](./useQuery_zh_CN.md)
- [usePaginationQuery](./usePaginationQuery_zh_CN.md)
- [useObject&useObjects](./useObject_zh_CN.md)

---------------
[< 上一篇：State Manager](../state-manager_zh_CN.md) | [返回上级：图状态](../README_zh_CN.md) | [下一篇：变更 >](../mutation/README_zh_CN.md)
