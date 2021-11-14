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

如果你的开发并不基于GraphQL服务端，就如同[本地示例](https://github.com/babyfish-ct/graphql-state/tree/master/example/client/src/graph/local)一样，上文中的createStateManager函数应该如下实现

```ts

import { newTypedConfiguration } from "./__generated";

function createStateManager() {
    return newTypedConfiguration().buildStateManager();
}
```

这里的newTypedConfiguration是graphql-ts-client-codegen自动在src/__generated中生成代码中的一个函数，newTypedConfiguration()返回一个配置对象，这个配置对象可以创建一个StateManager。

这里的代码很简单，配置对象未经过任何处理就直接用于创建StateManager。随着我们的深入了解，后续文档会让配置对象的操作丰富起来。

### 1.2 基于GraphQL服务端

如果你的开发基于GraphQL服务端，上文中的createStateManager函数应该如下实现

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

这里传入的GraphQLNetwork对象指定如何和服务端通信

（未来，框架会支持一个RESTNetwork将REST服务模拟成GraphQL服务）

## 2. 获取StateManager

要在React组件内部获取StateManager，比较好的方式是调用自动生成的代码中的函数useTypedStateManager
```ts
import { FC, memo } from 'react';
import { useTypedStateManager } from './__generated';

export const SomeComponent: FC = memo(() => {
    
    const stateManager = useTypedStateManager();
    
    ... more code ...
});
```

----------------------------------

[< Previous: 整合graphql-ts-client](./graphql-ts-client.md) | [Back to parent: 图状态](./README.md) | [Next: 查询 >](./query/README.md)
