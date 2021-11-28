# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/HTTP optimization

## Basic concept

Most of the functions related to HTTP optimization are based on an important concept: shape
```
shape = fetcher + variables
```

For example
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
Its shape is
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
Call it **A**, if there is another shape **B**
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
It is not difficult to see that all the data of shape B exists in A, and the parameters of the parameterized field are also completely equal. At this time we call

- **Shape A contains B, or, shape A is bigger than B**
- **Shape B is smaller than A**

> Note
>
> **The order of the fields does not affect the inclusiveness and equality judgment of the shape**

If there is a shape **C**
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
The parameter of "Query.findBookStore" in shape A is '{name: "a"}', and the parameter of "Query.findBookStore" in shape C is '{name: "NotA"}', theirs parameters do not match. Therefore, A and **C** are two unrelated shapes. It cannot be said that A contains C or that A is greater than C.

If there is a shape **D**
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
The "Query.findBookStores.location" field in shape D does not exist in shape A. Therefore, A and D are two unrelated shapes. It cannot be said that A contains D or that A is greater than D.

## Child chapters
- [Peak clipping](./peak-clipping.md)
- [Merge fragments](./merge-fragment.md)
- [Reuse request](./reuse-request.md)

--------------
[< Previous: Release policy](../release-policy.md) | [Back to parent: Documentation](../README.md)
