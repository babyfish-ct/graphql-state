# 一个新的React状态管理框架

#### 语言：[英文](https://github.com/babyfish-ct/graphql-state) | 中文

> 注意：
> 
> **GraphQL风格，但不只是GraphQL**
> 
> 对于REST服务，本框架能够在客户端将之映射为GraphQL服务，以GraphQL强大的语义访问REST服务！

## 本框架提供三大功能
1. 简单状态管理：类似于[recoil](https://github.com/facebookexperimental/Recoil)
2. **图状态管理**：
   
   本框架的核心价值，提供远比[Apollo Client](https://github.com/apollographql/apollo-client)和[Relay](https://github.com/facebook/relay)智能的服务
   
   > **它可以自动保证本地缓存的一致性。 在变更后，您既不需要编写复杂的代码来更新本地缓存，也不需要确定哪些查询会受到变更操作的影响而需要重新获取**
   
   *让我们来思考一些经典的案例*
    1. *修改一个对象的某些字段，由于其他对象的关联集合可能含过滤条件，修改后的对象是否和这些过滤条件匹配？它是否有可能需要被添加到某些集合中？它是否有可能需要从某些集合中消失？*
    2. *修改一个对象的某些字段，如果其他对象的关联集合在业务层面使用了这些字段排序，想关的这些集合是否应该被重新排序？*
    3. *插入一个对象的时候，它是否有可能需要被自动添加到其他对象的关联集合中。如果需要，添加到什么位置？*
    4. *把**A**对象添加到**B**对象的某个关联字段中，或者把**A**对象从**B**对象的某个关联字段中移除，如果**A**对象也有反向的关联字段引用B对象，这个反向的关联字段是否也需要被修改？*
   
   请查看[项目背景](./site/background_zh_CN.md)以了解更多
   
4. HTTP优化：通过合并请求和重用请用来减少HTTP请求数量

## 目录
- [项目背景](./site/background_zh_CN.md)
- [系统功能和GIF动画演示](./site/function-and-gif_zh_CN.md)
- [入门向导](./site/get-start_zh_CN.md)
- [运行附带例子](./site/run-demo_zh_CN.md)
- [文档](./doc/README_zh_CN.md)
