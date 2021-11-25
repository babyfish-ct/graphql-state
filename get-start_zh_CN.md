# 逐步向导


## 1. 启动服务端

下载本项目, 进入[example/server](example/server), 执行
```
yarn install
yarn start
```

## 2. 创建你的客户端

任意选一个目录，执行
```
yarn create react-app <YourAppName> --template typescript
```

## 3. 添加依赖

进入你的项目的根目录，执行
```
yarn add graphql-state graphql-ts-client-api
yarn add graphql-ts-client-codegen --dev
``` 

## 4. 配置代码生成器

进入你的项目的根目录，执行
```
mkdir scripts
cd scripts
touch codegen.js
``` 
粘贴如下代码至codegen.js
```js
const {GraphQLStateGenerator, loadRemoteSchema} = require("graphql-ts-client-codegen");
const path = require("path");
const generator = new GraphQLStateGenerator({
    schemaLoader: async() => {
        return loadRemoteSchema("http://localhost:8081/graphql");
    },
    targetDir: path.join(__dirname, "../src/__generated")
});
generator.generate();
```
打开项目根目录下的package.json文件, 找到一个名为"scripts"的对象字段，为其添加属性
```
"codegen": "node scripts/codegen.js"
```

## 5. 生产TS代码(依赖于服务端)

进入你的项目的根目录，执行

```
yarn codegen
``` 
*注意：*

*这是一次性的工作，你无需一次又一次地生产代码*

*这个步骤完成后，你就可能忘记代码生成相关的工作，直到服务端团队通知你他们的对外接口发生变更为止*

## 6. 修改React代码

打开你项目的'src/App.tsx'文件, 粘贴如下代码
```tsx
import { Suspense } from 'react';
import { useQuery, StateManager, StateManagerProvider, GraphQLNetwork } from 'graphql-state';
import { newTypedConfiguration, Schema } from './__generated';
import { query$, bookStore$$, book$$ } from './__generated/fetchers';

function createStateManager(): StateManager<Schema> {
    return newTypedConfiguration()
        .network(
            new GraphQLNetwork(async(body, variables) => {
                const response = await fetch('http://localhost:8081/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: body,
                        variables,
                    }),
                }); 
                return await response.json();
            })
        )
        .buildStateManager()
    ;
}
    
function BookStoreList() {

    const data = useQuery(
        query$.findBookStores(
            bookStore$$
            .books(
                book$$
            )
        )
    );
    
    return (
        <ul>
            {
                data.findBookStores.map(store => 
                    <li key={store.id}>
                        {store.name}
                        <ul>
                            {
                                store.books.map(book => 
                                    <li key={book.id}>{book.name}</li>
                                ) 
                            }
                        </ul>
                    </li>
                )
            }
        </ul>
    );
}

function App() {

    const stateManager = createStateManager();
    return (
      <StateManagerProvider stateManager={stateManager}>
          <Suspense fallback={<div>Loading...</div>}>
              <BookStoreList/>
          </Suspense>
      </StateManagerProvider>
    );
}

export default App;
```

## 7. 运行你的项目(依赖于服务端)

进入你的项目的根目录，执行
```
yarn start
```

____________________

[Back to home](./README_zh_CN.md)

