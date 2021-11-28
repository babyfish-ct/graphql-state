# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[Simple state](./README.md)/Effect

When creating a simple state, you can set the Effect logic for it, similar to react's mount/unmount behavior.

In this way, the simple state can not only manage the data inside the application, but also synchronize the external data of the application to the state manager and treat it the same.

In this example, we try to synchronize the size of the browser window to the state management

1. Define the state and its effect in "State.ts"

```ts
import { makeStateFactory } from 'graphql-state';

const { createComputedState } = makeStateFactory();

export interface WindowSize {
    readonly width: number;
    readonly height: number;
}

export const windowSizeState = createComputedState<WindowSize>(
    "windowSize", 
    () => {
        return { width: window.innerWidth, height: window.innerHeight };
    }, 
    {
        mount: ctx => {
        
            const onResize = () => {
                // When the user changes the size of the browser window, 
                // the current computed state needs to be recalculated
                ctx.invalidate(); 
            };
            
            // The current state is mounted
            window.addEventListener("resize", onResize);
            
            return () => {
                // The current state is unmounted
                window.removeEventListener("resize", onResize); 
            }
        }
    }
);
```

Next, we can reference the browser window size in any component, just like using the internal state of the application

```ts
import { FC, memo } from 'react';
import { useStateValue } from 'graphql-state';
import { windowSizeState } from './State';

export const DisplayView: FC = memo(() => {

    const {width, height} = useStateValue(windowSizeState);

    return (
        <div>
            Curent Browser size: ({width}, {height})
        </div>
    );
});
```

This example is based on the computed state. In fact, the same effect can be achieved based on the writable state. This demo is included in the supporting example, so I won’t repeat it here.

## Application of Effect in supporting examples

1. In [example/client/src/graphq/common/HttpLog.ts](https://github.com/babyfish-ct/graphql-state/blob/master/example/client/src/graph/common/HttpLog.ts), we use effect to synchronize the HTTP request log status, so that all the examples that need to communicate with the server show the HTTP request log.

2. In [/example/client/src/graph/graphql/log/EntityLog.ts](https://github.com/babyfish-ct/graphql-state/blob/master/example/client/src/graph/graphql/log/EntityLog.ts), we use Effect to build the GraphState cache database trigger event log state, and let related examples present a list of GraphState cache database trigger events.
------------------------------------------

[< Previous: Async state](./async.md) | [Back to parent: Simple state](./README.md) | [Next: Scopes >](./scope.md)

    
