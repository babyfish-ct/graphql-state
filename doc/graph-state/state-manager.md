# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[Graph State](./README.md)/StateManager

## 1. Create StateManager

When discussing simple states, it has been stated that the top-level components need to use &lt;StateManagerProvider&gt;
```ts
import { FC, memo } from 'react';
import { StateManagerProvider } from 'graphql-state';

export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            ... more child components ...
        </StateManagerProvider>
    );
});
```

No properties of &lt;StateManagerProvider/&gt; is specified here. In fact, <StateManagerProvider/> has a "stateManager" property.

This property is optional. For simple states, the default StateManager is sufficient; however, for graph states, we must explicitly specify our own StateManager.

```ts
import { FC, memo } from 'react';
import { StateManager, StateManagerProvider } from 'graphql-state';

export const App: FC = memo(() => {
    
    const stateManager = createStateManager();
    
    return (
        <StateManagerProvider stateManager={stateManager}>
            ... more child components ...
        </StateManagerProvider>
    );
});

function createStateManager() {
    // TODO: How to implement this function will be discussed later
}

```

### 1.1 Not based on GraphQL server

If your development is not based on the GraphQL server, just like the [local example](https://github.com/babyfish-ct/graphql-state/tree/master/example/client/src/graph/local), the createStateManager function above should be implemented as follows

```ts

import { newTypedConfiguration } from "./__generated";

function createStateManager() {
    return newTypedConfiguration().buildStateManager();
}
```

The "newTypedConfiguration" here is a function generated in "src/__generated" by graphql-ts-client-codegen. newTypedConfiguration() returns a configuration object, which can create a StateManager.

The code here is very simple, the configuration object is directly used to create the StateManager without any processing. With our in-depth understanding, follow-up documents will enrich the operations of configuration objects.

### 1.2 Based on GraphQL server

If your development is based on the GraphQL server, the createStateManager function above should be implemented as follows

```ts
import { GraphQLNetwork } from "graphql-state";
import { newTypedConfiguration } from "./__generated";

function createStateManager() {
    return newTypedConfiguration()
        .network(
            new GraphQLNetwork(async(body, variables) => {
                const response = await fetch('http://localhost:8081/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: body,
                        variables,
                    }),
                }); 
                return await response.json();
            })
        )
        .buildStateManager()
    ;
}
```

The GraphQLNetwork object passed in here specifies how to communicate with the server

(In the future, the framework will support a RESTNetwork to simulate REST services as GraphQL services)

## 2. Get StateManager

To get the StateManager inside the React component, a better way is to call the function "useTypedStateManager" in the automatically generated code
```ts
import { FC, memo } from 'react';
import { useTypedStateManager } from './__generated';

export const SomeComponent: FC = memo(() => {
    
    const stateManager = useTypedStateManager();
    
    ... more code ...
});
```

----------------------------------

[< Previous: Integrate graphql-ts-client](./graphql-ts-client.md) | [Back to parent: Graph state](./README.md) | [Next: Query >](./query/README.md)
