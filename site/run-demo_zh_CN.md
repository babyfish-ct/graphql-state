# 运行附带例子

1. 克隆本项目
```
git clone https://github.com/babyfish-ct/graphql-state.git
```

2. 启动服务端
```
cd ${clonedDir}/example/server
yarn install
yarn start
```
服务端在内存中模拟数据库, 当它没重启时，所有数据会被还原.

3. 启动客户端
```
cd ${clonedDir}/example/client
yarn install
yarn start
```
访问 http://localhost:3000

-----------------

[返回首页](../README_zh_CN.md)
