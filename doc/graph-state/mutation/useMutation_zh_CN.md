# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../../README_zh_CN.md)/[图状态](../README_zh_CN.md)/[变更](./README_zh_CN.md)/useMutation

useMutation函数用于向服务端提交变更

## 1. 其定义形式
```
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
>   ```
>   const { mutate} = useMutation(..., {
>      variables: { input: ...}
>   });
>   ```
> 2. 在调用此Hook返回的muate函数时指定参数
>   ```
>   const { mutate } = useMutation(..., {});
>   const onSubmitClick = useCallback(() => {
>       mutate({input: ...});
>   }, [mutate]);
>   ```
>   
> 如果两种行为都存在，2优先
  
## 2. 使用例子

以在附带的例子的[服务端例子](https://github.com/babyfish-ct/graphql-state/tree/master/example/server)中，Mutation支持一个mergeBook字段，用于插入或修改Book，其sdl如下
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

--------------
[< 上一篇：变更缓存](./mutate-cache_zh_CN.md) | [返回上级：变更](./README_zh_CN.md) | [下一篇：智能变更 >](./smart-mutation_zh_CN.md)
