# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[HTTP optimization](./README.md)/Peak clipping

In some cases, the user may modify the query conditions very quickly

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
In this example, the user's input is bound to the query condition in real time, and every time the user edits the query text, an asynchronous request will result.

Assuming that it takes 1 second to wait until the server returns the result, that is, each query will result in one second of loading, and the user enters 5 characters on the keyboard every second, so many requests are wasted.

Therefore, graphql-state does an automatic peak clipping for this, and the next query can only be performed after the previous query is over.

| Timeline | User input           | UI | Pending HTTP request| Remark |
|-------|-------------------|--------|-----------------|---|
|0 ms   |          |Loading|findBookStore({name: ""})| |
|200ms  | M        |Loading|findBookStore({name: ""})|Don't request 'findBookStores({name: "M"})', because there is a pending request|
|400ms  | MA       |Loading|findBookStore({name: ""})|Don't request 'findBookStores({name: "MA"})', because there is a pending request|
|600ms  | MAN      |Loading|findBookStore({name: ""})|Don't request 'findBookStores({name: "MAN"})', because there is a pending request|
|800ms  | MANN     |Loading|findBookStore({name: ""})|Don't request 'findBookStores({name: "MANN"})', because there is a pending request|
|1000ms  | MANNI   |Loading|findBookStore({name: "MANNI"})|After 'findBookStores({name: "M"})' finished, ignore 'findBookStores({name: "M"})', 'findBookStores({name: "MA"})', 'findBookStores({name: "MAN"})' and 'findBookStores({name: "MANN"})', Execute 'findBookStores({name: "MANNI"})' directly, because only the latest query parameters are meaningful|
|1200ms  | MANNIN  |Loading|findBookStore({name: "MANNI"})|Don't request findBookStores({name: "MANNIN"}), because there is a pending request|
|1400ms  | MANNING |Loading|findBookStore({name: "MANNI"})|Don't request findBookStores({name: "MANNING"}), because there is a pending request|
|2000ms  | MANNING |Loading|findBookStore({name: "MANNING"})|After findBookStores({name: "MANNI"})finished, ignore 'findBookStores({name: "MANNIN"})', Execute 'findBookStores({name: "MANNING"})', because only the latest query parameters are meaningful|
|3000ms  | MANNING |The result of findBookStore({name: "MANNING"})|||

> Note
>
> The asynchronous data hook of graphql-state supports an "options.async-object" parameter with the following three values
> - suspense
> - suspense-refetch
> - async-object
>
> **Only "async-object" supports asynchronous peak clipping optimization**

-----------------

[Back to parent: HTTP optimization](./README.md) | [Next: Merge fragments>](./merge-fragment.md)
