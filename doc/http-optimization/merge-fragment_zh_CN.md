# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/[HTTP优化器](./README_zh_CN.md)/碎片合并

useObject和useObjects根据id/ids查询对象/对象集合，虽然方便，但容易导致请求碎片化。

graphql-state能把这些碎片化的请求合并成一个大请求

```ts
import { FC, memo, Suspense } from "react";
import { StateManagerProvider } from "graphql-state";
import { useObject } from "../../__generated";
import { author$$, book$$ } from "../../__generated/fetchers";

const SingleBookReference: FC<{
    readonly id: string,
}> = memo(({id}) => {

    const book = useObject(
        book$$.authors(author$$), 
        id,
        { objectStyle: "optional" }
    );

    return (
        <div>
            {JSON.stringify(book)}
        </div>
    );
});

const MultipleBookReferences: FC<{
    readonly ids: ReadonlyArray<string>,
}> = memo(({ids}) => {

    const books = useObjects(
        book$$.authors(author$$), 
        ids,
        { objectStyle: "optional" }
    );

    return (
        <ul>
            <RawValueView value={books}/>
            {books.map(book => <li key={book.id}>
              {JSON.stringify(book)}
            </li>)}
        </ul>
    );
});

const App: FC = memo(() => {

    const stateManager = createStateManager();
    
    return (
        <StateManager stateManager={}>
            <Suspense fallback={<div><Spin/>Loading...</div>}>
                <SingleBookReference id="a62f7aa3-9490-4612-98b5-98aae0e77120"/>
                <MultipleBookReferences ids={[
                    "a62f7aa3-9490-4612-98b5-98aae0e77120",
                    "e110c564-23cc-4811-9e81-d587a13db634",
                    "914c8595-35cb-4f67-bbc7-8029e9e6245a"
                ]}/>
                <MultipleBookReferences ids={[
                    "914c8595-35cb-4f67-bbc7-8029e9e6245a",
                    "8f30bc8a-49f9-481d-beca-5fe2d147c831"
                ]}/>
            </Suspense>  
        </StateManager>
    );
});

function createStateManager() {
    return ...;
}
```

各界面对useObject/useObjects的调用如下
|API|a62f7aa3-9490-4612-98b5-98aae0e77120|e110c564-23cc-4811-9e81-d587a13db634|914c8595-35cb-4f67-bbc7-8029e9e6245a|8f30bc8a-49f9-481d-beca-5fe2d147c831|
|---|---|---|---|---|
|useObject|<ul><li>[x] </li></ul>| | | |
|useObjects| |<ul><li>[x] </li></ul>|<ul><li>[x] </li></ul>|<ul><li>[x] </li></ul>|
|useObjects| | |<ul><li>[x] </li></ul>|<ul><li>[x] </li></ul>|

如果没有碎片合并优化，在缓存无数据的情况下，三个HTTP请求将会被发送到服务端

新运的是，这三个hook查询的形状一样
> 注意
> 
> [HTTP优化器](./README_zh_CN.md)中讨论过，
> ```
> shape = fetcher + variables
> ```
> 但useObject/useObjects的id/ids参数不属于variables，所以，这些请求的形状一样

形状一样的useObject/useObjects会被合并为一个请求。这些hook共享合并后的请求返回的数据，并各自选取自己需要的数据。

最终，实际只像服务端发送一个HTTP请求

**Body**
```
query(
	$ids: [String!]!, 
	$typeName: String!, 
	$name: String
) {
	entities(ids: $ids, typeName: $typeName) {
		__typename
		... on Book {
			id
			name
			authors(name: $name) {
				id
				name
			}
		}
	}
}
```
**Variables**
```
{
  "typeName": "Book",
  "ids": [
    "a62f7aa3-9490-4612-98b5-98aae0e77120",
    "e110c564-23cc-4811-9e81-d587a13db634",
    "914c8595-35cb-4f67-bbc7-8029e9e6245a",
    "8f30bc8a-49f9-481d-beca-5fe2d147c831"
  ]
}
```


-----------
[< 上一篇：异步削峰](./peak-clipping_zh_CN.md) | [返回上级：HTTP优化器](./README_zh_CN.md) | [下一篇：请求重用 >](./reuse-request_zh_CN.md)
