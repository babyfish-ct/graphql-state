# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../../README.md)/[Graph state](../README.md)/[Mutation](./README.md)/useMutation

The "useMutation" function is used to submit changes to the server

## 1. Definition
```ts
useMutation<
    T extends object,
    TVariables extends object
>(
    fetcher: ObjectFetcher<"Mutation", T, TVariables>,
    options?: {
        readonly variables?: TVariables,
        readonly onSuccess?: (data: T) => void,
        readonly onError?: (error: any) => void,
        readonly onCompelete?: (data: T | undefined, error: any) => void
    }
): { 
    readonly mutate: (variables?: TVariables) => Promise<T>,
    readonly loading: boolean,
    readonly data?: T,
    readonly error: any
}
```

** Parameters **
fetcher: Fetcher of [graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client), its root object type must be "Mutation"
options: an optional object containing the following fields
- variables: request parameters
- onSuccess: call this function after the request is successful
- onError: call this function after the request fails
- onComplete: Whether it succeeds or fails, it will be called after the request is completed, which is equivalent to "finally" in a programming language
  
** Return Type**
An object containing the following fields
- mutate: The user needs to call this function to send the mutation request to the server. Unlike useQuery, usePaginationQuery, useObject and useObjects, the mutation request will not be sent automatically and must be called by the user himself
- loading: Whether it is waiting to return the result
- error: the exception returned by the server
- data: The server returns the result. If loading is true or error exists, it must be undefined

> Note
> 
> There are two ways to specify request parameters
> 1. Specify "options.variables" when calling this hook, for example
>   ```ts
>   const { mutate} = useMutation(..., {
>      variables: { input: ...}
>   });
>   ```
> 2. Specify the parameters when calling the "muate" function returned by this hook
>   ```ts
>   const { mutate } = useMutation(..., {});
>   const onSubmitClick = useCallback(() => {
>       mutate({input: ...});
>   }, [mutate]);
>   ```
>   
> If both behaviors exist, 2 takes precedence
  
## 2. Usage

In the [server side of the attached example](https://github.com/babyfish-ct/graphql-state/tree/master/example/server), "Mutation" supports a "mergeeBook" field, which is used to insert or update Book. Its sdl is as follows
```
type Mutation {
    mergeBook(input: BookInput): Book
}

input BookInput {
    id: String!
    name: String!
    storeId: String,
    authorIds: [String!]!
}
type Book {
    id: String!,
    name: String!,
    store: BookStore
    authors: [Author!]!
}

type BookStore { ... }

type Author { ... }
```

The mergeBook field accepts a BookInput and returns Book. The returned object can be used to modify the local cache data

> In some cases, the returned object and the equivalent information contained in the incoming Input are equivalent, but this is not absolute. The server is allowed to return data that is inconsistent with the input, and the client should take the returned data as the standard .
>
> In any case, this is a very common and universal design method

The fetcher of the mutation operation we expect to perform should look like this
```ts
const MUTATION_FETCHER = mutation$.mergeBook(
    { input: ... },
    book$$
    .store(bookStore$.id)
    .authors(author$.id)
);
```

Among them, 
```ts
    book$$
    .store(bookStore$.id)
    .authors(author$.id)
```
should be used to specify the return format of the mutation request and also to update the local data.
We can slightly modify the code to separate this part, as follows

```ts
const BOOK_MUATION_INFO = book$$
    .store(bookStore$.id)
    .authors(author$.id)
;

const MUTATION_FETCHER = mutation$.mergeBook(
    { input: ... },
    BOOK_MUATION_INFO
)
```

Now, let's see sample code of "useMutation"

```ts
import { FC, memo } from 'react';
import { useMutation } from 'graphql-state';
import { useTypedStateManager } from './__generated';
import { mutation$, book$$, bookStore$, author$ } from './__generated/fetchers';
import { BookInput } from './__generated/inputs';

const BOOK_MUATION_INFO = book$$
    .store(bookStore$.id)
    .authors(author$.id)
;

export const BookMutationComponent: FC = memo(() => {

    const stateManager = useTypedStateManager();
    
    const { mutate, loading } = useMutation(
        mutation$.mergeBook(BOOK_MUTATION_INFO),
        {
            onSuccess: data => {
                stateManager.save(BOOK_MUTATION_INFO, data);
            },
            onError: () => {
                alert("Error");
            }
        }
    );
    
    const onSaveClick = useCallback(() => {
        const input: BookInput = ... more code, create input object by UI form...;
        muate({ input });
    }, [muate]);
    
    return (
        <>
            ...more code, UI form...
            <button onClick={onSaveClick} disabled={loading}>
                {loading ? "Saving" : "Save"}
            </button>
        </>
    );
});
```

When the user clicks the "Save" button, the mutation is submitted to the server, and the local cache is updated according to the returned results of the server

--------------
[< Previous: Mutate cache](./mutate-cache.md) | [Back to parent: Mutation](./README.md) | [Next: Smart mutation >](./smart-mutation.md)
