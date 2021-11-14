# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README.md)/图状态

所谓图状态，并非一定需要GraphQL服务端，而是可以被GraphQL风格的API读写的缓存的数据。

> - 配套的demo中，[本地数据例子](https://github.com/babyfish-ct/graphql-state/tree/master/example/client/src/graph/local)是不需要GraphQL服务器的，其所有缓存数据都采用GraphQL风格的API进行读取
> - 未来，本框架会基于REST服务端模拟GraphQL服务，REST服务也可以通过GraphQL风格的API来读写，这对一些遗留的服务端项目很有用

图状态是针对复杂对象类型的缓存，通过[graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)(我开发的另外一个框架，一个基于TypeScript的GraphQL DSL)进行访问，因此graphql-state依赖于graphql-ts-client。

## 下级章节

- [整合graphql-ts-client](./graphql-ts-client.md)
- [StateManager](./state-manager.md)
- [查询](./query/README.md)
  - [useQuery](./query/useQuery.md)
  - [usePaginationQuery](./query/usePaginationQuery.md)
  - [useObject/useObjects](./query/useObject.md)
- [变更](./mutation/README.md)
  - [变更缓存](./mutation/mutate-cache.md)
  - [useMutation](./mutation/useMutation.md)
  - [智能更新](./mutation/README.md)
  - [双向关联](./mutation/bidirectional-association.md)
- [触发器](./trigger.md)

-------

[< 上一篇: 简单状态](../simple-state/README.md) | [返回上级: 文档](../README.md) | [下一篇: 释放策略 >](../release-policy.md)
