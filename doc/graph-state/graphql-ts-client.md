# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[Graph state](./README.md)/Integrate graphql-ts-client

## 1. Add dependencies

If the project wants to use graph state, in addition to graphql-state, graphql-ts-client needs to be imported.
```
yarn add graphql-state graphql-ts-client-api
yarn add graphql-ts-client-codegen --dev
```

### 2. Generate code

graphql-ts-client is a strongly typed DSL that requires code generation.

> Attention
>
> The code generation work only needs to be done once when the graph schema remains unchanged! This is also the advantage of graphql-ts-client.

#### 2.1. Based on GraphQL server

If your development is aimed at a GraphQL server, just like the [graphql example](https://github.com/babyfish-ct/graphql-state/tree/master/example/client/src/graph/graphql), you need to do this

1. Ensure that the server has been started

2. Create a NodeJS file with any name under "react-project-directory/scripts", here assume the file name is "codegen.js", edit its content as follows

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

3. Configure the "codegen" command in the "package.json" of the react project, find the "scripts" attribute of this json file, and add a sub-attribute
```
"codegen": "node scripts/codegen.js
```

4. Execute 
```
yarn codegen
```
for the first development, or when the server team informs you that their interface has changed, the relevant code required by the DSL can be generated under "src/__generated"

#### 2.2. Not based on GraphQL server

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
