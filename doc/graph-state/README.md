# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/Graph state

Graph state does not necessarily require a GraphQL server, but cached data that can be read and written by GraphQL-style APIs.

- In the supporting demo, the [local data example]((https://github.com/babyfish-ct/graphql-state/tree/master/example/client/src/graph/local)) does not require a GraphQL server, and all cached data uses GraphQL-style APIs for reading and writing.

- In the future, this framework will simulate GraphQL services based on the REST server. REST services can also be read and written through GraphQL-style APIs. This is useful for some legacy server projects.

Graph state is a cache for complex object accessed through [graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)(a GraphQL DSL based on TypeScript), so graphql-state depends on graphql-ts-client.

## Child chapters

- [Integrate graphql-ts-client](./graphql-ts-client.md)
- [StateManager](./state-manager.md)
- [Query](./query/README.md)
  - [useQuery](./query/useQuery.md)
  - [usePaginationQuery](./query/usePaginationQuery.md)
  - [useObject/useObjects](./query/useObject.md)
- [Mutation](./mutation/README.md)
  - [Muate cache](./mutation/mutate-cache.md)
  - [useMutation](./mutation/useMutation.md)
  - [Smart mutation](./mutation/README.md)
  - [Bidirectional association](./mutation/bidirectional-association.md)
- [Trigger](./trigger.md)

-------

[< Previous: Simple state](../simple-state/README.md) | [Back to parent: Documentation](../README.md) | [Next: Release policy >](../release-policy.md)
