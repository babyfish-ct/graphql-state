# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README.md)/[简单状态](./README.md)/作用域

和其它react状态管理框架不同，graphql-state不仅支持全局状态，也可以使用作用域

## 使用方法

1. 让状态支持作作用域

默认情况下，状态只支持全局作用域，需要明确地让其支持作用域
```ts
import { makeStateFactory } from 'graphql-state';
const { createState } = makeStateFactory();

export const countState = createState("anyScopeCount", 0, {
    scope: "any-scope"
});
```

如果，这里不指定scope为"any-scope"，默认就是"global-scope-only"

2. 建立作用作用域

```ts
import { FC, memo } from 'react';
import { StateManagerProvider, Scope } from 'graphql-state';
import { InputView } from './InputView';
import { OutputView } from './InputView';
export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <Scope name="scope-1">
                <InputView/>
                <OutputView/>
            </Scope>
            <Scope name="scope-2">
                <InputView/>
                <OutputView/>
            </Scope>
        </StateManagerProvider>
    );
});
```
缺失的InputView和OutputView在下文给出。但是我们看到，有两组InputView和OutputView，分别属于两个不同的作用域

3. InutView和OutptuView

先在InputView.tsx中实现InputView
```ts
import { FC, memo useCallback } from 'react';
import { useStateAccessor } from 'graphql-state';
import { countState } from './State';

export const InputView: FC = memo(() => {

    const count = useStateAccessor(countState, {
        scope: "local"
    });
    
    const onIncreseClick = useCallback(() => {
        count(count() + 1);
    }, [count]);
    
    return <button>Increase</button>;
}); 
```
> 这里，我们调用useStateAccessor将scope指定为"local"，而非默认的"auto"。
> 
> 这表示不使用全局作用域的状态，而使用当前作用域的状态。
> 
> 注意: 如果被访问状态在被创建时并未将scope设置为"any-scope"，此举将会导致运行时异常，这样设计的目的是为了防止过度自由。

同理，实现OutputView
```ts
import { FC, memo useCallback } from 'react';
import { useStateValue } from 'graphql-state';
import { countState } from './State';

export const InputView: FC = memo(() => {

    const count = useStateValue(countState, {
        scope: "local"
    });
   
    return <div>count</div>;
}); 
```

4. 运行效果

上面代码运行起来后
- 每个作用域内部，InputView和OutputView可以利用状态互通信息
- 两个作用域之间彼此隔离，就如同两个不同的站点一样。

## 嵌套作用域

作用域可以无限嵌套, 比如

```ts
<Scope name="levelOne">
    ...
    <Scope name="levelTwo">
        ...
        <Scope name="levelThree">
            ...
                ...
                    <Scope name="levelN">
                        ...
                    </Scope>
                ...
            ...
        </Scope>
        ...
    </Scope>
    ...
</Scope>
```

---------

[< 上一篇: Effect](./effect.md) | [返回上级:简单状态](./README.md)
