# Run attached demos

1. Clone this project
```
git clone https://github.com/babyfish-ct/graphql-state.git
```

2. Start server
```
cd ${clonedDir}/example/server
yarn install
yarn start
```
After the server starts, you will see
```
1. GraphQL server is started, please access http://localhost:8081/graphql
2. REST server is started, please access http://localhost:8081/rest
```
> The server simulates the database in memory. When it restarts, all data will be restored.

3. Start client
```
cd ${clonedDir}/example/client
yarn install
yarn start
```
Access http://localhost:3000 by browser

-----------------

[Back to home](https://github.com/babyfish-ct/graphql-state)
