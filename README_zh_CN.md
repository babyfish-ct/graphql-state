# 一个新的React状态管理框架

## 项目描述
UI状态的本质是什么?

> 一个主变更会导致**N**个额外变更。UI越复杂，**N**越大。

(如果你曾经开发过相对复杂的UI，你可能对此会产生共鸣；如果没有，不要担心，让我们一起在[项目背景](./site/background_zh_CN.md)中讨论这个问题)

这是UI状态的本质, 也是UI开发最大的麻烦。

**本框架允许用户只关注主变更, 而其它额外修改都会被自动处理。**

*相较于[Apollo client](https://github.com/apollographql/apollo-client)和[Relay](https://github.com/facebook/relay)，在变更之后，你只需要把主变更保存到本地缓存即可。既不需要在本地缓存中人为修改其它受影响的数据，也不需要指定哪些查询会被影响而需要重新获取，因为额外变更都会被自动处理。*

## 关于REST
项目的名称是graphql-state。别担心, 它是 **"GraphQL风格，但不仅仅是GraphQL"**，他可以把REST服务映射为GraphQL服务。

## 目录
- [项目背景](./site/background_zh_CN.md)
- [系统功能和GIF动画演示](./site/function-and-gif_zh_CN.md)
- [入门向导](./site/get-start_zh_CN.md)
- [运行附带例子](./site/run-demo_zh_CN.md)
- [文档](./doc/README_zh_CN.md)
