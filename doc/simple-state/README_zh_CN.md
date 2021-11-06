# [grpahql-state](../../)/[文档](../README_zh_CN.md)/简单状态

简单状态使用方式非常类似于recoil，但是它可以和图状态配合使用。

框架支持三种简单状态

1. 可写状态
2. 计算状态
3. 异步状态

## 创建状态的API

这些就个函数用于创建状态，相当于编程语言中的变量定义。它们的返回值应该被全局变量记录，以便于在整个应用范围内共享。

||无参数|有参数|
|---|---|---|
|可写状态|createState|createParameterizedState|
|计算状态|createComputedState|createParameterizedComputedState|
|异步状态|createAsyncState|createParameterizedAsycState|

这些函数的使用方法在更细节的文档中有详细的讨论，这里讨论如何导入他们，分两种情况

1. 如果你的应用仅仅使用了简单状态，并没有使用图状态
```ts
import { makeStateFactory } from "graphql-state";

const { 
    createState, 
    createComputedState, 
    createAsynState,
    createParameterizedState,
    createParameterizedComputedState,
    createParameterizedAsyncState
} = makeStateFactory();
```

2. 如果你的应用使用了图状态，在相关代码被生成后，如下代码是更好的选择
```ts
import { 
    createState, 
    createComputedState, 
    createAsynState,
    createParameterizedState,
    createParameterizedComputedState,
    createParameterizedAsyncState
} from "<Relative path the root dir of generaed code>";

```

## 使用被定义状态的API

使用状态的API只有两个: useStateValue和useStateAccessor

```ts
import { 
    useStateValue, 
    useStateAccessor 
} from 'graphql-state';
```

## 更多文档

1. [可写状态](./writable_zh_CN.md)
2. [计算状态](./computed_zh_CN.md)
3. [异步状态](./async_zh_CN.md)
4. [Effect](./effect_zh_CN.md)
5. [作用域](./scope_zh_CN.md)

---------------------------------------
[返回上级](../README_zh_CN.md)|[下一篇：图状态](../graph-state/README_zh_CN.md)
