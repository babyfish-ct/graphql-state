# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README.md)/[图状态](./README.md)/触发器

内置的缓存数据库支持触发器，支持如下两类事件
- EntityChangeEvent: 表示数据被修改
- EntityEvictEvent: 表示数据从缓存中被清理

## 1. EntityChangeEvent

EntityChangeEvent表示实体对象被修改的事件

### 1.1. 事件类型定义

1. 针对任意对象类型的通用事件的定义
  ```ts清理
  export interface EntityChangeEvent {
      readonly eventType: "change";
      readonly typeName: string;
      readonly id: any;
      readonly changedType: "insert" | "update" | "delete";
      readonly changedKeys: ReadonlyArray<EntityKey>;
      has(changedKey: EntityKey): boolean;
      oldValue(changedKey: EntityKey): any;
      newValue(changedKey: EntityKey): any;
  }

  export type EntityKey = string | {
      readonly name: string,
      readonly variables: any
  };
  ```
  
- eventType: 永远为"change"，用于区分和EntityChangeEvent和EntityEvictEvent
- typeName: 触发事件对象类型。如果对象存在继承关系，取运行时实际类型的名称
- id: 对象的id
- changedType: 三个取值
  - "insert": 表示对象被插入到缓存中，此时，newValue函数可以被调用，但oldValue会抛出异常
  - "update": 表示缓存中的对象被修改，此时，oldValue和newValue函数都可以被调用
  - "delete": 表示缓存中的对象被删除，此时，oldValue函数可以被调用，但newValue会抛出异常
- has: 判断一个字段是否被修改，只有被修改的字段才可以作为oldValue和newValue函数的参数，否则会导致异常
  参数: 
  - changedKey: 字段，分两种情况
    - 无参数字段: 一个字符串即可
    - 参数化字段: 传递一个对象，包含两个对象
      - name: 字段的名称
      - variables: 字段的参数对象
- oldValue: 取得一个字段被修改前的旧值，如果changedType为"insert"或同样的参数会导致has函数返回false, 将会导致异常
  参数: 
  - changedKey: 字段，分两种情况
    - 参数为无参数字段: 一个字符串即可
    - 参数化字段: 传递一个对象，包含两个对象
      - name: 字段的名称
      - variables: 字段的参数对象
- newValue: 取得一个字段被修改后的新值，如果changedType为"delete"或同样的参数会导致has函数返回false, 将会导致异常
  参数: 
  - changedKey: 字段，分两种情况
    - 无参数字段: 一个字符串即可
    - 参数化字段: 传递一个对象，包含两个对象
      - name: 字段的名称
      - variables: 字段的参数对象
 
2. 针对特定对象类型的专用事件定义（被代码生成器生成，这里以[example/client/src/graph/__generated_graphql_schema__/triggers/BookChangeEvent.ts](https://github.com/babyfish-ct/graphql-state/blob/master/example/client/src/graph/__generated_graphql_schema__/triggers/BookChangeEvent.ts)为例）
  ```ts
  import {ImplementationType} from '../CommonTypes';
  import {BookArgs, BookFlatType} from '../fetchers/BookFetcher';

  export interface BookChangeEvent {

      readonly eventType: "change";

      readonly typeName: ImplementationType<"Book">;

      readonly id: string;

      readonly changedType: "insert" | "update" | "delete";

      readonly changedKeys: ReadonlyArray<BookEntityKey<any>>;

      has(changedKey: BookEntityKey<any>): boolean;

      oldValue<TFieldName extends BookEntityFields>(
          key: BookEntityKey<TFieldName>
      ): BookFlatType[TFieldName] | undefined;

      newValue<TFieldName extends BookEntityFields>(
          key: BookEntityKey<TFieldName>
      ): BookFlatType[TFieldName] | undefined;
  }

  export type BookEntityKey<TFieldName extends BookEntityFields> = 
      TFieldName extends "authors" ? 
      { readonly name: "authors"; readonly variables: BookArgs } : 
      TFieldName
  ;

  export type BookEntityFields = 
      "name" | 
      "store" | 
      "authors"
  ;
  ```
和EntityChangeEvent类型的作用一样，只是这个类型的类型更精确而已。其字段的含义也并无差异，此处不在赘述。

### 1.2 添加对象变更事件

1. 基于通用事件类型

```ts
import { FC, memo } from 'react';
import { EntityChangeEvent } from 'graphql-state';
import { useTypedStateManager } from './__generated';

export const MyComponent: FC = memo(() => {
    const stateManager = useTypedStateManager();
    useEffect(() => {
        const onChange = (e: EntityChangeEvent) => {
            if (e.typeName === "BookStore") {
                // TODO
            } else if (e.typeName === "Book") {
                // TODO
            } else if (e.typeName === "Author") {
                // TODO:
            }
        };
        stateManager.addEntityChangeListener(onChange);
        return () => {
            stateManager.removeEntityChangeListener(onChange);
        }
    }, [stateManager]);
    
    return ...;
});
```

2. 基于专用事件类型

```ts
import { FC, memo } from 'react';
import { useTypedStateManager } from './__generated';
import { BookStoreChangeEvent, BookChangeEvent, AuthorChangeEvent } from './__generated/triggers';

export const MyComponent: FC = memo(() => {
    const stateManager = useTypedStateManager();
    useEffect(() => {
        const listeners = {
            "BookStore": (e: BookStoreChangeEvent) => {
                // TODO
            },
            "Book": (e: BookChangeEvent) => {
                // TODO
            },
            "Author": (e: AuthorChangeEvent) => {
                // TODO
            }
        };
        stateManager.addEntityChangeListeners(listeners);
        return () => {
            stateManager.removeEntityChangeListeners(listeners);
        }
    }, [stateManager]);
    
    return ...;
});
```

## 2. EntityEvictEvent

EntityChangeEvent表示实体对象从缓存中被清理

> 注意
> 
> 1. 数据从缓存中被清理和数据被删除是完全不同的两个概念
> 2. 对于应用开发者而言，EntityEvictEvent并像EntityChangeEvent那样有用，如果不感兴趣，可以跳过此章节，直接看应用举例

### 2.1 事件类型定义

1. 针对任意对象类型的通用事件的定义
  ```ts
  export interface EntityEvictEvent {
      readonly eventType: "evict";
      readonly typeName: string;
      readonly id: any;
      readonly causedByGC: boolean;
      readonly evictedType: "row" | "fields";
      readonly evictedKeys: ReadonlyArray<EntityKey>;
      has(evictedKey: EntityKey): boolean;
      evictedValue(evictedKey: EntityKey): any;
  }

  export type EntityKey = string | {
      readonly name: string,
      readonly variables: any
  };
  ```
- eventType: 永远为"evict"，用于区分和EntityEvictEvent和EntityChangeEvent
- typeName: 触发事件对象类型。如果对象存在继承关系，取运行时实际类型的名称
- id: 对象的id
- **causedByGC**: 是否由垃圾回收触发
  - true: 当前事件是因为垃圾回收导致
  - false: 当前时间是因为智能变更导致
  > 注意
  > 
  > causedByGC为true表示垃圾回收导致事件。只有被所有查询丢弃的数据才会被垃圾回收，所以事件不会导致任何查询自动刷新
- id: 对象的id
- evictType: 连个个取值
  - "row": 表示整个对象从缓存中被清理
  - "fields": 表示对象的某些字段从缓存中被清理
- has: 判断一个字段是从缓存中被清理，只有被清理的字段才可以作为evictedValue函数的参数，否则会导致异常
  参数: 
  - evictedKey: 字段，分两种情况
    - 无参数字段: 一个字符串即可
    - 参数化字段: 传递一个对象，包含两个对象
      - name: 字段的名称
      - variables: 字段的参数对象
- evictedValue: 取得一个字段从缓存中被清理之前的的旧值，如果同样的参数会导致has函数返回false, 将会导致异常
  参数: 
  - changedKey: 字段，分两种情况
    - 参数为无参数字段: 一个字符串即可
    - 参数化字段: 传递一个对象，包含两个对象
      - name: 字段的名称
      - variables: 字段的参数对象
```
2. 针对特定对象类型的专用事件定义（被代码生成器生成，这里以[example/client/src/graph/__generated_graphql_schema__/triggers/BookChangeEvent.ts](https://github.com/babyfish-ct/graphql-state/blob/master/example/client/src/graph/__generated_graphql_schema__/triggers/BookChangeEvent.ts)为例）

  ```ts
  import {ImplementationType} from '../CommonTypes';
  import {BookArgs, BookFlatType} from '../fetchers/BookFetcher';


  export interface BookEvictEvent {

      readonly eventType: "evict";

      readonly typeName: ImplementationType<"Book">;

      readonly id: string;

      readonly causedByGC: boolean;

      readonly evictedType: "row" | "fields";

      readonly evictedKeys: ReadonlyArray<BookEntityKey<any>>;

      has(evictedKey: BookEntityKey<any>): boolean;

      evictedValue<TFieldName extends BookEntityFields>(
          key: BookEntityKey<TFieldName>
      ): BookFlatType[TFieldName] | undefined;
  }

  export type BookEntityKey<TFieldName extends BookEntityFields> = 
      TFieldName extends "authors" ? 
      { readonly name: "authors"; readonly variables: BookArgs } : 
      TFieldName
  ;

  export type BookEntityFields = 
      "name" | 
      "store" | 
      "authors"
  ;
  ```
和EntityChangeEvent类型的作用一样，只是这个类型的类型更精确而已。其字段的含义也并无差异，此处不在赘述。

### 1.2 添加对象从缓存中被清理事件

1. 基于通用事件类型

```ts
import { FC, memo } from 'react';
import { EntityEvictEvent } from 'graphql-state';
import { useTypedStateManager } from './__generated';

export const MyComponent: FC = memo(() => {
    const stateManager = useTypedStateManager();
    useEffect(() => {
        const onEvict = (e: EntityEvictEvent) => {
            if (e.typeName === "BookStore") {
                // TODO
            } else if (e.typeName === "Book") {
                // TODO
            } else if (e.typeName === "Author") {
                // TODO:
            }
        };
        stateManager.addEntityEvictListener(onChange);
        return () => {
            stateManager.removeEntityEvictListener(onChange);
        }
    }, [stateManager]);
    
    return ...;
});
```

2. 基于专用事件类型

```ts
import { FC, memo } from 'react';
import { useTypedStateManager } from './__generated';
import { BookStoreEvictEvent, BookEvictEvent, AuthorEvictEvent } from './__generated/triggers';

export const MyComponent: FC = memo(() => {
    const stateManager = useTypedStateManager();
    useEffect(() => {
        const listeners = {
            "BookStore": (e: BookStoreEvictEvent) => {
                // TODO
            },
            "Book": (e: BookEvictEvent) => {
                // TODO
            },
            "Author": (e: AuthorEvictEvent) => {
                // TODO
            }
        };
        stateManager.addEntityEvictListeners(listeners);
        return () => {
            stateManager.removeEntityEvictListeners(listeners);
        }
    }, [stateManager]);
    
    return ...;
});
```

### 3. 实际应用举例

我们尝试定义个简单状态selectedBookId

```ts
import { createState } from './__generated';
import { BookChangeEvent } from './__generated/triggers';

export const selectedBookIdState = createState<string | undefined>("selectedBookId", undefined, {
    mount: ctx => {
        const listners = {
            "Book": (e: BookChangeEvent) => {
                if (e.changeType === "delete" && e.id === ctx()) {
                    ctx(undefined); // reset this simple state when current book is deleted
                }
            }
        };
        ctx.stateManager.addEntityChangeListeners(listeners);
        return () => {
            ctx.stateManager.removeEntityChangeListeners(listeners);
        };
    }
});
```

这里，我们使用简单状态的effect注册/注销触发器，如果当前状态所指的对象从缓存中被删除，那么将简单状态设置为undefined。

selectedBookId只是一个id，而非Book对象，要将之转换为selectedBook对象, 有两种方法

1. 如果其他页面对selectedBook对象的形状要求差别很大，可以在其他页面中使用useObject，例如
  ```ts
  import { FC, memo } from 'react';
  import { useStateValue } from 'graphql-state';
  import { selectedBookIdState } from './State'; 
  import { book$$, author$$ } from './__generated';

  export const MyComponent: FC = memo(() => {
      
      const selectedBookId = useStateValue(selectedBookIdState);
      
      const { data: selectedBook, loading } = useObject(
          
          book$$
          .authors(
              author$$
          ),
          
          selectedBookId,
          
          {
              asyncStyle: "async-object",

              objectStyle: "optional" //重要，否则useObject的第二个参数不得为undefined
          }
      );

      return ...;
  });
  ```
  > 注意
  > 
  > 代码中objectStyle为"optional"很重要，否则useObject的第二个参数不允许为undefined，将会导致编译错误
    
2. 如果其他页面对selectedBook对象的形状要求差别不大，可以selectedBook包装为一个简单对象，方便各页面复用，例如
  ```
  import { book$$, author$$ } from './__generated';
  import { ModelType } from 'graphql-ts-client';
   
  const SELECTED_BOOK_SHAPE = book$$
      .authors(
      author$$
      )
  ;

  export const selectedBookState = createAsyncState<
      ModelType<typeof SELECTED_BOOK_SHAPE>
  >("selectedBook", ctx => {
      return ctx.object(
          ctx(selectedBookIdState),
          {
              objectStyle: "optional" //重要，否则ctx.object首个参数不得为undefined
          }
      );
  });
  ```
  > 注意
  > 
  > 代码中objectStyle为"optional"很重要，否则ctx.object的第一个参数不允许为undefined，将会导致编译错误
  
----------
[< 上一篇: 变更](./mutation/README.md) | [返回上级: 图状态](./README.md)
