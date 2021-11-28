# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[HTTP optimization](./README.md)/Merge fragments

"useObject" and "useObjects" query objects/object collections based on id/ids. Although convenient, if not optimized, HTTP requests will be fragmented.

graphql-state can merge these fragmented requests into one big request

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
            <RawValueView value={books.filter(book => book !== undefined)}/>
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

The calls of each react component to useObject/useObjects are as follows
|API|a62f7aa3-9490-4612-98b5-98aae0e77120|e110c564-23cc-4811-9e81-d587a13db634|914c8595-35cb-4f67-bbc7-8029e9e6245a|8f30bc8a-49f9-481d-beca-5fe2d147c831|
|---|---|---|---|---|
|useObject|<ul><li>[x] </li></ul>| | | |
|useObjects| |<ul><li>[x] </li></ul>|<ul><li>[x] </li></ul>|<ul><li>[x] </li></ul>|
|useObjects| | |<ul><li>[x] </li></ul>|<ul><li>[x] </li></ul>|

If there is no fragmentation optimization, three HTTP requests will be sent to the server when there is no data in the cache

Fortunately, these three hook queries have the same shape

> Note
>
> Discussed in [HTTP optimization](./README.md),
> ```
> shape = fetcher + variables
> ```
> But the id/ids parameters of useObject/useObjects do not belong to variables, so these requests have the same shape

useObject/useObjects with the same shape will be combined into one request. These hooks share the data returned by the merged request and select the data they need.

Finally, only one HTTP request will be sent to the server

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
[< Previous: Peak clipping](./peak-clipping.md) | [Back to parent: HTTP optimization](./README.md) | [Next: Reuse request >](./reuse-request.md)
