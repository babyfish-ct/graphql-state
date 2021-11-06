# 一个新的React管理框架

**语言: [English](/) | 中文**

系统功能
![image](./architecture_zh_CN.png "系统功能")

## 1. 简单状态
一套看起来非常类似于recoil的状态管理，用于管理业务对象模型以外的零散数据，可以方便地和图状态配合。

## 2. 图状态
本框剪的核心价值，一套和apollo-client/以及relay类似的复杂状态管理，用于其内部的图数据缓存远强于apollo cache和relay store中的normalized cache，也是我创建此框架的根本原因。

图状态管理支持两个核心功能
### 2.1. 智能更新
![image](./smart-mutation_zh_CN.png "智能更新")

### 2.2. 双向关联管理
