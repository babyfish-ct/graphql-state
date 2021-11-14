# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/[简单状态](./README_zh_CN.md)/异步状态

异步状态是计算状态的一种，和计算状态相比，唯一的不同在于其计算函数是异步的。

鉴于此，本章节不会讲解异步状态的计算依赖和参数化，而是重点讲解异步结果的接收。

首先，在State.ts中定义异步状态

```ts
import { makeStateFactory } from 'graphql-state';

const { createAsyncState } = makeStateFactory();

export const delayedState = createAsyncState("delayed-state", async ctx => {
    await delay(3000);
    return "Hello world";
});

function delay(millis: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => { resolve() }, millis);
    })
}
```
使用useStateValue函数从异步状态取值时，可以设置asyncStyle参数，该参数有三种不同的取值
1. suspense
2. suspense-refetch
3. async-object

**随着asyncStyle参数的不同，useStateValue函数的返回类型也不同**，对应到三种不同的异步值获取模式

## 1. suspense
这是默认的模式，即使调用useStateValue时不指定asyncStyle，也采用此模式。

在DelayedView.tsx中以"suspense"模式使用useStateValue函数
```ts
import { FC, memo } from 'react';
import { useStateValue } from 'graphql-state';
import { delayedState } from './State';

export const DelayedView: FC = memo(() => {
    const delayed = useStateValue(delayedState, {
        asyncStyle: "suspense" // 外部组件必须使用<Suspense/>包裹当前组件
    });
    return <div>The delayed value is {delayed}</div>;
});
```
对suspense模式而言，useStateValue的返回值就是异步结果，看起来似乎和非异步状态无异。但需要更外围的组件使用&lt;Suspense/&gt;，否则将会导致运行时异常。
App.tsx的实现应该如下
```
import { FC, memo, Suspense } from 'react';
import { StateManagerProvider } from 'graphql-state';
import { DelayedView } from './DelayedView';

export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <Suspense fallback={<div>Loading...</div>}>
                <DelayedView/>
            </Suspense>
        </StateManagerProvider>
    );
});
```

## 2. suspense-refetch
和suspense模式类似，也需要外部组件使用&lt;Suspense/&gt;，但是useStateValue的返回类型和suspense不同，假设异步状态的数据类型为T，此模式下useStateValue函数的返回类型如下
```ts
{
    readonly data: T;
    readonly refetch: () => void
}
```
在DelayedView.tsx中以"suspense-refetch"模式使用useStateValue函数
```ts
import { FC, memo } from 'react';
import { useStateValue } from 'graphql-state';
import { delayedState } from './State';

export const DelayedView: FC = memo(() => {
    const { data: delayed, refetch}  = useStateValue(delayedState, {
        asyncStyle: "suspense-refetch" // 外部组件必须使用<Suspense/>包裹当前组件
    });
    return (
        <>
            <div>The delayed value is {delayed}</div>
            <button onClick={refetch}>Recompute async state</button>
        </>
    );
});
```
和suspense模式相似，外围的组件使用&lt;Suspense/&gt;，否则将会导致运行时异常。上文对此已有示范，为了简洁，这里不再重复罗列相应代码

## 3. async-object
和前两种模式不同，外部组件不再需要使用&lt;Suspense/&gt;，由用户自己控制异步状态，假设异步状态的数据类型为T，此模式下useStateValue函数的返回类型如下
```ts
{
    readonly data？: T;
    readonly loading: boolean;
    readonly error: any;
    readonly refetch: () => void
}
```
> 注意
>
> 和suspense-refetch模式下useStateValue返回对象的data字段不同，这里的data字段被"?"修饰，这是一个可以为undefined的字段。当loading为true时，data必然为undefined。

在DelayedView.tsx中以"async-object"模式使用useStateValue函数
```ts
import { FC, memo } from 'react';
import { useStateValue } from 'graphql-state';
import { delayedState } from './State';

export const DelayedView: FC = memo(() => {
    const { data: delayed, loading, refetch}  = useStateValue(delayedState, {
        asyncStyle: "async-object"
    });
    return (
        <>
            {loading && <div>Loading...</div>}
            {
                delayed && <>
                    <div>The delayed value is {delayed}</div>
                    <button onClick={refetch}>Recompute async state</button>
                </>
            }
        </>
    );
});
```

async-object模式不再需要外围的组件使用&lt;Suspense/&gt;
```
import { FC, memo } from 'react';
import { StateManagerProvider } from 'graphql-state';
import { DelayedView } from './DelayedView';

export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <DelayedView/>
        </StateManagerProvider>
    );
});
```

[< 上一篇：计算状态](./computed_zh_CN.md) | [返回上级：简单状态](./README_zh_CN.md) | [下一篇：Effect >](./effect_zh_CN.md)
