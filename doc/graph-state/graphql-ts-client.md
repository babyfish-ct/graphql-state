# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[图状态](./README.md)/整合graphql-ts-client

## 1. 添加依赖

如果项目要使用图状态，除graphql-state外，还需要导入graphql-ts-client。
```
yarn add graphql-state graphql-ts-client-api
yarn add graphql-ts-client-codegen --dev
```

### 2. 生成代码

graphql-ts-client是一个强类型的DSL，需要进行代码生成工作。

> 注意: 
>
> 在图的Schema不变的情况下，代码生成工作只需要进行一次! 这也是graphql-ts-client的优势所在。

#### 2.1. 基于GraphQL服务端

如果你的开发针对一个GraphQL服务端，就如同[graphql示例](https://github.com/babyfish-ct/graphql-state/tree/master/example/client/src/graph/graphql)一般，你需要这样做

1. 确保服务端已经启动

2. 在"react项目目录/scripts"下创建一个名称随意的NodeJS文件，这里假设文件名为"codegen.js"，编辑其内容如下
```js
const { GraphQLStateGenerator, loadRemoteSchema } = require("graphql-ts-client-codegen");
const path = require("path");

const generator = new GraphQLStateGenerator({
    schemaLoader: async() => {
      return loadRemoteSchema("http://localhost:8081/graphql");
    },
    targetDir: path.join(__dirname, "../src/__generated")
});
generator.generate();
```

3. 在react项目的package.json配置codegen命令，找到此json文件的"scripts"对象属性，添加一个子属性
```
"codegen": "node scripts/codegen.js
```

4. 首次开发，或服务端团队告知你他们的接口发生变更时，执行
```
yarn codegen
```
即可在src/__generated下生成DSL所需相关代码

#### 2.2. 不基于GraphQL服务端

如果你的开发不针对一个GraphQL服务端，就如同[本地数据示例](https://github.com/babyfish-ct/graphql-state/tree/master/example/client/src/graph/local)一般，你需要这样做

1. 由于没有GraphQL服务端，你必须自己定义图的schema。在"react项目目录/scripts"下创建一个名称随意的sdl(Schema Definition Language)文件，这里假设文件名为"schema.sdl"，编辑其内容如下
```
type BookStore {
    id: ID!
    name: String!
    books: [Book!]!
}

type Book {
    id: ID!
    name: String!
    store: BookStore
    authors: [Author!]!
}

type Author {
    id: ID!
    name: String!
    books: [Book!]!
}

type Query {
    bookStores: [BookStore!]!
    books: [Book!]!
    authors: [Author!]!
}
```

2. 在"react项目目录/scripts"下创建一个名称随意的NodeJS文件，这里假设文件名为"codegen.js"，编辑其内容如下
```
const { GraphQLStateGenerator, loadLocalSchema } = require("graphql-ts-client-codegen");
const path = require("path");

const generator = new GraphQLStateGenerator({
    schemaLoader: async() => {
      return loadLocalSchema("scripts/local/schema.sdl");
    },
    targetDir: path.join(__dirname, "../src/__generated")
});
generator.generate();
```

3. 在react项目的package.json配置codegen命令，找到此json文件的"scripts"对象属性，添加一个子属性
```
"codegen": "node scripts/codegen.js
```

4. 首次开发，或schema.sdl文件变更时，执行
```
yarn codegen
```
即可在src/__generated下生成DSL所需相关代码

--------------------------------------

[Back to parent: 图状态](./README.md) | [Next: StateManager >](./state-manager.md)
