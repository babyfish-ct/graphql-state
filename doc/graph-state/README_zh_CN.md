# [graphql-state]/(/README_zh_CN.md)/[文档](../README_zh_CN.md)/图状态

所谓图状态，并非一定需要GraphQL服务端，而是可以被GraphQL风格的API读写的缓存的数据。

> - 配套的demo中，[本地数据例子](https://github.com/babyfish-ct/graphql-state/tree/master/example/client/src/graph/local)是不需要GraphQL服务器的，其所有缓存数据都采用GraphQL风格的API进行读取
> - 未来，本框架会基于REST服务端模拟GraphQL服务，REST服务也可以通过GraphQL风格的API来读写，这对一些遗留的服务端项目很有用

图状态通过graphql-ts-client(我开发的另外一个框架，一个基于TypeScript的GraphQL DSL)进行访问，因此graphql-state依赖于graphql-ts-client。

## 下级章节

- [整合graphql-ts-client](./graphql-ts-client_zh_CN.md)
- [查询](./query/README_zh_CN.md)
  - [useQuery](./query/useQuery_zh_CN.md)
  - [usePaginationQuery](./query/usePaginationQuery_zh_CN.md)
  - [useObject/useObjects](./query/useObject_zh_CN.md)
- 变更
  - StateManager & useMutation
  - 智能更新
  - 双向关联
