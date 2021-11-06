# [graphql-state](/)/[文档](../doc/README_zh_CN.md)/[简单状态](./README_zh_CN.md)/可写状态

# 1. 无参数可写状态

1. 新建一个State.ts文件，定义状态
```
import { makeStateFactory } from "graphql-state";

const { createState } = makeStateFactory();

export const countState = createState("count", 1);
```
第一个参数无实际意义，保证每个状态都有一个唯一的name即可
第二个参数表示可选状态的默认值

2. 新建一个OutputView.tsx，显示此状态
```
import { FC, memo } from "react";
import { useStateValue } from "graphql-state";
import { countState } from "./State";

export const InputView: FC = memo(() => {

    const count = useStateValue(countState);
    
    return <div>Current count: {count}</div>;
});

```
useStateValue函数用于从状态读取值

3. 新建一个InputView.tsx，编辑此状态
```
import { FC, memo, useCallback } from "react";
import { useStateAccessor } from "graphql-state";
import { countState } from "./State";

export const InputView: FC = memo(() => {

    const count = useStateAccessor(countState);
    
    const onIncreaseClick = useCallback(() => {
        count(count() + 1);
    }, [count]);

    return <button>Increase</button>;
});
```

和返回状态值的useStateValue不同，useStateAccessor返回一个函数。
- 不带参数调用次函数，比如"count()"，表示读取状态的值
- 带参数调哟过此函数，比如"count(3)"，表示修改状态的值

例子中的"count(count() + 1)"表示读取状态的旧值，加上1，在设置为状态的新值

4. 在App.tsx中，整合所有

import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { OutputView } from "./OutputView";
import { InputView } from "./InputView";

```
export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <OutputView/>
            <InputView/>
        </StateManagerProvider>
    );
});
```
> 注意
> 使用状态管理的的前提是，顶层用<StateManagerProvider/>包裹
