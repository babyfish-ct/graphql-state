# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/HTTP优化

## 基本概念

大部分和HTTP优化的功能，都基于一个重要的概念：shape
```
shape = fetcher + variables
```

例如
```ts
const data = useQuery(
    query$.findBookStores(
        bookStore$$
        .books(
            { name: ParameterRef.of("bookName") },
            book$$
            .authors(
                { name: ParameterRef.of("authorName") },
                author$$
            )
        )
    ),
    {
        variables: {
            name: "a",
            bookName: "b",
            authorName: "c"
        }
    }
);
```
其形状为
```
+-------+
| Query |
+-+-----+
  |
  |     +-----------------------------+
  \---->| findBookStores({name: "a"}) |
        +-+---------------------------+
          |
          |     +----+
          +---->| id |
          |     +----+
          |
          |     +------+
          +---->| name |
          |     +------+
          |
          |     +--------------------+
          \---->| books({name: "b"}) |
                +-+------------------+
                  |
                  |     +----+
                  +---->| id |
                  |     +----+
                  |
                  |     +------+
                  +-----| name |
                  |     +------+
                  |
                  |     +----------------------+
                  \---->| authors({name: "c"}) |
                        +-+--------------------+
                          |
                          |     +----+
                          +---->| id |
                          |     +----+
                          |
                          |     +------+
                          \---->| name |
                                +------+         
```
将之称为A，假如有另外一个形状B
```
+-------+
| Query |
+-+-----+
  |
  |     +-----------------------------+
  \---->| findBookStores({name: "a"}) |
        +-+---------------------------+
          |
          |     +----+
          +---->| id |
          |     +----+
          |
          |     +------+
          +---->| name |
          |     +------+
          |
          |     +--------------------+
          \---->| books({name: "b"}) |
                +-+------------------+
                  |
                  |     +----+
                  +---->| id |
                  |     +----+
                  |
                  |     +------+
                  \-----| name |
                        +------+
```
不难看出，形状B的所有数据，都在A存在，且参数化字段的参数也完全相等。这时我们称

- **形状A包含B，或，形状A比B大**
- **形状B比A小**

> 注意
> 
> 字段的顺序不会影响形状的包含性和相等性的判断

假如一个形状C
```
+-------+
| Query |
+-+-----+
  |
  |     +--------------------------------+
  \---->| findBookStores({name: "NotA"}) |
        +-+------------------------------+
          |
          |     +----+
          +---->| id |
          |     +----+
          |
          |     +------+
          \---->| name |
                +------+
```
形状A中Query.findBookStore的参数为{name: "a"}，形状C中Query.findBookStore的参数为{name: "NotA"}，参数不匹配。所以，A和C是毫不相干的两个形状，不能说A包含C或A大于C。

假如一个形状D
```
+-------+
| Query |
+-+-----+
  |
  |     +-----------------------------+
  \---->| findBookStores({name: "a"}) |
        +-+---------------------------+
          |
          |     +----+
          +---->| id |
          |     +----+
          |
          |     +------+
          +---->| name |
          |     +------+
          |
          |     +----------+
          \---->| location |
                +----------+
```
形状D中Query.findBookStores.location字段在形状A中不存在。所以，A和D是毫不相干的两个形状，不能说A包含D或A大于D。

## 下级文档
- [异步削峰](./peak-clipping_zh_CN.md)
- [碎片合并](./merge-fragment_zh_CN.md)
- [请求重用](./reuse-request_zh_CN.md)

--------------
[< 上一篇：释放策略](../release-policy_zh_CN.md) | [返回上级：文档](../README_zh_CN.md)
