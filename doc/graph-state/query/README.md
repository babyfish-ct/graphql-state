# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../../README.md)/[Graph state](../README.md)/Query

The framework supports four functions for querying data from the cache or server

- useQuery
- usePaginationQuery
- useObject
- useObjects

They are imported in different ways

1. "useQuery" and "usePaginationQuery" are directly imported from 'graphql-state'
```ts
import { useQuery, usePaginationQuery } from 'graphql-state';
```

2. "useObject" and "useObjects" are imported from the generated code
```ts
import { useObject, useObjects } from '../__generated';
```

## Child chapters

- [useQuery](./useQuery.md)
- [usePaginationQuery](./usePaginationQuery.md)
- [useObject&useObjects](./useObject.md)

---------------
[< Previous: State Manager](../state-manager.md) | [Back to parent: Graph state](../README.md) | [Next: Mutation >](../mutation/README.md)
