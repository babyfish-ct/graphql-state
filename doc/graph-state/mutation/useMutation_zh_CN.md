# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../../README_zh_CN.md)/[图状态](../README_zh_CN.md)/[变更](./README_zh_CN.md)/useMutation

useMutation函数用于向服务端提交变更

## 1. 其定义形式
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

fetcher: 一个[graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)的fetcher，其根对象类型必须为"Mutation"

options: 一个可选的对象，包含如下字段
  - variables: 请求参数
  - onSuccess: 请求成功后调用此函数
  - onError: 请求失败后调用此函数
  - onComplete: 无论成功失败，请求完成后都会调用，相当于编程编程语言中的"finally"
  
返回值：一个对象，包含如下字段
  - mutate: 用户需要调用此函数发送变更请求到服务端。和useQuery，usePaginationQuery，useObject以及useObjects不同，变更请求不会自动发送，必须由用户自己调用
  - loading: 是否正在等待返回结果
  - data: 服务端返回结果。如果loading为true或error存在，必然为undefined
  - error: 服务端返回的异常

> 注意
> 
> 有两种方法可以指定请求参数
> 1. 在调用此Hook时指定options.variables，例如
>   ```ts
>   const { mutate} = useMutation(..., {
>      variables: { input: ...}
>   });
>   ```
> 2. 在调用此Hook返回的muate函数时指定参数
>   ```ts
>   const { mutate } = useMutation(..., {});
>   const onSubmitClick = useCallback(() => {
>       mutate({input: ...});
>   }, [mutate]);
>   ```
>   
> 如果两种行为都存在，2优先
  
## 2. 使用例子

以在[附带的例子的服务端](https://github.com/babyfish-ct/graphql-state/tree/master/example/server)中，Mutation支持一个mergeBook字段，用于插入或修改Book，其sdl如下
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

mergeBook字段接受一个BookInput，返回Book，可以利用这个返回值修改本地数据

> 某些情况下，返回的对象和传入的Input所包含等价信息是等价相同的，但这不是绝对的，服务端允许返回和input不一致的数据，客户端应该以返回的数据为准。
> 
> 无论如何，这是一个很常见且通用的设计方法

如此，我们期望执行的变更操作的fetcher看起来应该是这个样子
```ts
const MUTATION_FETCHER = mutation$.mergeBook(
    { input: ... },
    book$$
    .store(bookStore$.id)
    .authors(author$.id)
);
```

其中
```ts
    book$$
    .store(bookStore$.id)
    .authors(author$.id)
```
既要用与指定mutation的返回格式，又要用于更新本地数据。我们可以稍微修改一下代码，把这部分独立出来，如下
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

好了，现在，我们给出useMutation的示例代码

```ts
import { FC, memo } from 'react';
import { useMutation } from 'graphql-state';
import { useTypedStateManager } from './__generated/fetchers';
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

当用户点击Save按钮后，提交变更到服务端，并根据服务的的返回结果更新本地缓存

--------------
[< 上一篇：变更缓存](./mutate-cache_zh_CN.md) | [返回上级：变更](./README_zh_CN.md) | [下一篇：智能变更 >](./smart-mutation_zh_CN.md)
