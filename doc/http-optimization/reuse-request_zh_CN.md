# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/[HTTP优化器](./README_zh_CN.md)/请求重用

```
import { FC, memo, Suspense } form 'react';
import { useQuery, StateManagerProvider } from 'graphql-state';
import { query$, bookStore$$, book$$, author$$ } from './generated';

export const BiggerShapeComponent: FC = memo(() => {
    const data = useQuery(
        query.findBookStores(
            bookStore$$
            .books(
                book$$
                .authors(
                    author$$
                )
            )
        )
    ); 
    
    return ...;
});

const SmallerShapeComponent: FC = memo(() => {
    const data = useQuery(
        query.findBookStores(
            bookStore$$
        )
    ); 
    
    return ...;
});

const App: FC = memo(() => {

    const stateManager = createStateManager();
    
    return (
        <StateManagerProvider stateManager={stateManager}>
            <Suspense fallback={<div>Loading...</div>}>
                <BiggerShapeComponent/>
                <SmallerShapeComponent/>
            </Suspense>
        </StateManagerProvider>
    );
});

function createStateManager() {
    return ...;
}

```

在[HTTP优化器](./README_zh_CN.md)中我们讨论了形状，以及形状之间的包哈关系。

很明显，在这个例子，BiggerShapeComponent内部查询的形状包含SmallerShapeComponent内部查询的形状，SmallerShapeComponent内部查询能查到的数据一定包含在BiggerShapeComponent内部查询返回的数据中。

最终，SmallerShapeComponent并不会发出HTTP请求，它会重用BiggerShapeComponent内部的查询的HTTP请求，盗用其返回数据并从中选取直接要的结果。

> 注意
> 
> 无论形状更大的查询的HTTP请求是否已经被发送出去，只要形状更大的请求还未从服务端获得值，此优化就能生效（如果形状更大的请求已经查询到数据，会被缓存直接优化，没机会执行到HTTP请求这里）
> - 针对形状更大的查询的HTTP请求还未发送的情况，请运行附带例子并访问http://localhost:3000/graphState/httpOpitimizator/mergeDifferentShapes
> - 针对形状更大的查询的HTTP请求已经发送的情况，请运行附带例子并访问http://localhost:3000/graphState/httpOpitimizator/reusePendingQueries

-------------------------

[< 上一篇: 碎片合并](./merge-fragment_zh_CN.md) | [返回上级：HTTP优化器]
