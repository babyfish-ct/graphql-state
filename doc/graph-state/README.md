# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/Graph state

Graph state does not necessarily require a GraphQL server, but cached data that can be read and written by GraphQL-style APIs.

- In the supporting demo, the [local data example]((https://github.com/babyfish-ct/graphql-state/tree/master/example/client/src/graph/local)) does not require a GraphQL server, and all cached data uses GraphQL-style APIs for reading and writing.

- In the future, this framework will simulate GraphQL services based on the REST server. REST services can also be read and written through GraphQL-style APIs. This is useful for some legacy server projects.

图状态是针对复杂对象类型的缓存，通过[graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)(一个基于TypeScript的GraphQL DSL)进行访问，因此graphql-state依赖于graphql-ts-client。

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

[< Previous: 简单状态](../simple-state/README.md) | [Back to parent: 文档](../README.md) | [Next: 释放策略 >](../release-policy.md)
