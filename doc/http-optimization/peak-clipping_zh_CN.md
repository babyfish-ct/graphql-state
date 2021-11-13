# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/[HTTP优化器](./README_zh_CN.md)/异步削峰

某些时候，用户对查询条件的修改可能很快

```ts
import { FC, memo, useState, useCallback, ChangeEvent } from 'react';
import { useQuery } from 'graphql-state';
import { query$, bookStore$$ } from './generated';

export const BookStoreList: FC = memo(() => {

    const [name, setName] = useState("");
    
    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    }, []);
    
    const { data, loading } = useQuery(
        query$.findBookStores(
            bookStore$$
        ),
        { 
            asyncStyle: "async-object",
            variables: {
                name
            } 
        }
    );
    return <>
        {loading && <div>Loading...</div>}
        {
            data && <ul>
                data.findBookStores.map(store => {
                    <li key={store.id}>
                        {JSON.stringiyf(store)}
                    </li>
                })
            </ul>
        }
    </>;
});
```

在这个例子中过，用户的输入被实时绑定到了查询条件上，每次用户编辑查询文本，都会导致一次一步请求。

假设需要1秒才能从等到服务端返回的结果，即每次查询都会导致一秒钟的loading，而用户每秒在键盘上输入5个字符，那么有很多请求都是浪费。

因此graphql-state对此做了自动削峰，必须上一次的查询结束后才能进行下一次查询

| 时间线 | 用户输入           | 界面呈现 | 正在执行的HTTP请求|备注|
|-------|-------------------|--------|-----------------|---|
|0 ms   |          |Loading|findBookStore({name: ""})| |
|200ms  | M        |Loading|findBookStore({name: ""})|不执行findBookStores({name: "M"})，因为存在未返回的请求|
|400ms  | MA       |Loading|findBookStore({name: ""})|不执行findBookStores({name: "MA"})，因为存在未返回的请求|
|600ms  | MAN      |Loading|findBookStore({name: ""})|不执行findBookStores({name: "MAN"})，因为存在未返回的请求|
|800ms  | MANN     |Loading|findBookStore({name: ""})|不执行findBookStores({name: "MANN"})，因为存在未返回的请求|
|1000ms  | MANNI   |Loading|findBookStore({name: "MANNI"})|findBookStores({name: "M"})返回后，忽略findBookStores({name: "M"}), findBookStores({name: "MA"}), findBookStores({name: "MAN"}), findBookStores({name: "MANN"})直接执行findBookStores({name: "MANNI"})。因为只有最新的查询参数才有意义|
|1200ms  | MANNIN  |Loading|findBookStore({name: "MANNI"})|不执行findBookStores({name: "MANNIN"})，因为存在未返回的请求|
|1400ms  | MANNING |Loading|findBookStore({name: "MANNI"})|不执行findBookStores({name: "MANNING"})，因为存在未返回的请求|
|1400ms  | MANNING |Loading|findBookStore({name: "MANNI"})|不执行findBookStores({name: "MANNING"})，因为存在未返回的请求|
|2000ms  | MANNING |Loading|findBookStore({name: "MANNING"})|不执行findBookStores({name: "MANNI"})返回后，忽略findBookStores({name: "MANNIN"})，直接执行findBookStores({name: "MANNING"})。因为只有最新的查询参数才有意义|
|3000ms  | MANNING |findBookStore({name: "MANNING"})的结果|||

> 注意
> 
> graphql-state的异步数据hook支持一个options.async-object参数，具备如下三个取值
> - suspense
> - suspense-refetch
> - async-object
> 
> **仅async-object支持异步削峰优化**

-----------------

[< 返回上级：HTTP优化器](./README_zh_CN.md) | [下一篇：碎片合并>](./merge-fragment_zh_CN.md)
