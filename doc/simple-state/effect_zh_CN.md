[graphql-state](/)/[文档](../README_zh_CN.md)/[简单状态](./README_zh_CN.md)/Effect

创建简单状态时，可以为其设置Effect逻辑，类似于react的mount/unmount行为。

通过这种方式，简单状态不但可以管理应用内部的数据，还可以把应用外部数据同步到状态管理器中，一视同仁地对待。

在这个例子中，我们尝试把浏览器窗口的大小同步到状态管理中

1. 在State.ts中定义状态和其Effect

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
                ctx.invalidate(); // 用户改变浏览器窗口大小时，当前计算属性需要重新计算
            };
            window.addEventListener("resize", onResize); // 当前状态被mount
            return () => {
                window.removeEventListener("resize", onResize); // 当前状态被unmount
            }
        }
    }
);
```

接下来我们就可以在任何组件中引用浏览器窗口大小了，就如同使用应用内部状态一样

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

这个例子是基于计算状态实现的。其实，基于可写状态也可以达到一样的效果。此演示包含在配套example中，此处不再赘述。

------------------------------------------

[< 上一篇：异步状态](./async_zh_CN.md) | [返回上级：简单状态](../README_zh_CN.md) | [下一篇：作用域 >](./scope_zh_CN.md)

    