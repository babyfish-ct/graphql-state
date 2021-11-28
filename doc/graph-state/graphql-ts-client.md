# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[Graph state](./README.md)/Integrate graphql-ts-client

## 1. Add dependencies

If the project wants to use graph state, in addition to graphql-state, [graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client) needs to be imported.
```
yarn add graphql-state graphql-ts-client-api
yarn add graphql-ts-client-codegen --dev
```

### 2. Generate code

[graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client) is a strongly typed DSL that requires code generation.

> Note
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

If your development is not aimed at a GraphQL server, just like a local data example(https://github.com/babyfish-ct/graphql-state/tree/master/example/client/src/graph/local), you need to do this

1. Since there is no GraphQL server, you must define the schema of the graph yourself. Create a sdl (Schema Definition Language) file with any name under "react-project-directory/scripts". Here assume the file name is "schema.sdl" and edit its content as follows
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

2. Create a NodeJS file with any name under "react-project-directory/scripts", here assume the file name is "codegen.js", edit its content as follows
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

3. Configure the "codegen" command in the "package.json" of the react project, find the "scripts" attribute of this json file, and add a sub-attribute
```
"codegen": "node scripts/codegen.js
```

4. Execute
```
yarn codegen
```
for the first development or when the schema.sdl file is changed, the relevant code required by the DSL can be generated under "src/__generated".

--------------------------------------

[Back to parent: Graph state](./README.md) | [Next: StateManager >](./state-manager.md)
