# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/[图状态](./README_zh_CN.md)/触发器

内置的缓存数据库支持触发器，支持如下两类事件
- EntityChangeEvent：表示数据被修改
- EntityEvictEvent：表示数据从缓存中被移除

## 1. EntityChangeEvent

### 1.1. 时间类型定义

1. 针对任意对象类型的通用事件的定义
  ```ts
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
  
- eventType: 永远为"change"，勇于区分和EntityChangeEvent和EntityEvictEvent
- typeName: 触发事件对象类型。如果对象存在继承关系，取运行时实际类型的名称
- id: 对象的id
- changedType: 三个取值
  - "insert": 表示对象被插入到缓存中，此时，newValue函数可以被调用，但oldValue会抛出异常
  - "update": 表示缓存中的对象被修改，此时，oldValue和newValue函数都可以被调用
  - "delete": 表示缓存中的对象被删除，此时，oldValue函数可以被调用，但newValue会抛出异常
- has: 判断一个字段是否被修改，只有被修改的字段才可以作为oldValue和newValue函数的参数，否则会导致异常
  - 指定参数为无参数字段：一个字符串即可
  - 指定参数为有参数字段：传递一个对象，包含两个对象
    - name: 字段名
    - variables: 参数对象
- oldValue: 取得一个字段被修改前的旧值，如果changedType为"insert"或同样的参数会导致has函数返回false, 将会导致异常
  - 指定参数为无参数字段：一个字符串即可
  - 指定参数为有参数字段：传递一个对象，包含两个对象
    - name: 字段名
    - variables: 参数对象
- newValue: 取得一个字段被修改后的新值，如果changedType为"delete"或同样的参数会导致has函数返回false, 将会导致异常
  - 指定参数为无参数字段：一个字符串即可
  - 指定参数为有参数字段：传递一个对象，包含两个对象
    - name: 字段名
    - variables: 参数对象
 
2. 针对特定对象类型的专用时间定义（被代码生成器生成，这里使用为例[example/client/src/graph/__generated_graphql_schema__/triggers/BookChangeEvent.ts](https://github.com/babyfish-ct/graphql-state/blob/master/example/client/src/graph/__generated_graphql_schema__/triggers/BookChangeEvent.ts)）
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

## 1.2 添加对象变更事件

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

----------
[< 上一篇：变更](./mutation/README_zh_CN.md) | [返回上级：图状态](./README_zh_CN.md)
