# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/[图状态](./README_zh_CN.md)/StateManager

## 1. 创建StateManager

在讨论简单状态时已经说明过顶层组件需要使用&lt;StateManagerProvider&gt;
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
这里的&lt;StateManagerProvider/&gt;并指定任何属性。事实上，&lt;StateManagerProvider/&gt;具备一个stateManager属性。

该属性是可选的，对简单状态而言，默认的StateManager已经足够了；但是，对于图状态而言，必须明确地传递我们自己的StateManager。

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
    // TODO: 后文讨论此函数如何实现
}

```

### 1.1 不基于GraphQL服务端

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

[< 上一篇：整合graphql-ts-client](./graphql-ts-client_zh_CN.md) | [返回上级：图状态](./README_zh_CN.md) | [下一篇：查询 >](./query/README_zh_CN.md)
