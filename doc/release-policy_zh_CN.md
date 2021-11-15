# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](./README_zh_CN.md)/释放策略

# 1. 内存管理策略

状态关系需要消耗浏览器的内存资源，需要不停地把这些宝贵的资源归还浏览器，网站才能可持续地运行下去

graphql-state的内存结构如下

![image](./release-policy.png "内存结构")

分为两个部分

- 引用计数可以管理的部分
  - useStateValue, useStateAccessor函数引用简单状态StateValue。
  - useQuery, usePaginationQuery, useObject, useObjects函数引用查询结果QueryResult。
  
  > 虽然计算状态和异步状态会导致StateValue对其他StateValue或QueryResult形成依赖，但这种依赖是树形依赖，不是图形依赖，没有循环引用的问题，因此，对StateValue和QueryResult这些数据对象而言，引用计数内存管理是可行的
  
  StateValue和QueryResult内置一个引用计数，默认为0，且支持两个内部操作
  - retain: 将引用计数加1
  - release: 将引用计数减1，如果为结果为0，释放资源。这里的释放可以不仅可以选择立即释放，还可以选择延迟释放，延迟释放等待过程中过，数据可以复活。对于如何延迟释放，用户是可以干预的，也是本文要重点讨论的。
  
  不同的react界面使用上述hook访问数据时，如果所有参数都相同，将会共享相同的StateValue或QueryResult，否则各自获得各自的StateValue或QueryResult。但无论如何
  - 对获取到到新数据进行retain操作
  - 如果数据变化或react组件被unmount，对旧数据进行release操作。

  一旦某个StateVale或QueryResult的引用计数被release操作归0，它就会被立即释放或延迟释放。
  
- 必须采用垃圾回收的部分

  框架内置了图数据的缓存数据库，其中存放normalize处理后的数据，类似于关系型数据库。这些数据之间的相互引用关系错综复杂，循环引用常常出现。对这部分数据而言，必须使用垃圾回收策略。

  受引用计数管理的StateValue和QueryResult对象充当垃圾回收算法的根引用。每当有StateValue或QueryResult被释放时，都会自动触发一次垃圾回收。垃圾回收过程用户无法干预，不是本文重点所讨论的话题。
  
## 2. 延迟释放

上文谈到，StateValue和QueryResult的释放是用户可以干预的。要干预此行为，需要指定一个函数
```ts
(aliveTime: number, variables: any) => number
```
**参数**
  - aliveTime:
    从被创建到现在为止，当前StateValue/QueryResult共存活了多长时间，以毫秒为单位
  - variables:
    当前数据的参数，即用户调用useStateValue, useStateAccessor，useQuery，usePaginationQuery，useObject, useObjects函数时指定的options.variables。
    > - 对于options.variables内部的每个字段而言，如果其值为""且GraphQL schema并未强制要求其非null，则variables字段被自动视为undefined
    > - 对于options.variables内部的每个字段都为undefined或被视为undefined，variables整体为undefined
**返回值**
  延迟释放的等待时间，以毫秒为单位
  - 如果小于或等于0，立即释放
  - 否则，延迟释放
    - 等待结束过程中，如果数据被再次retain，将会导致数据被复活。延迟释放和等待行为被取消。
    - 如果等待过程中对象并未复活，到期后，当前StateValue或QueryResult将会真正释放。并触发一次针对图数据缓存数据库的垃圾回收。

### 2.1 默认的延迟释放
```ts
(aliveTime: number, variables: any) => number {
    if (aliveTime < 1000) {
        return 0;
    }
    if (variables !== undefined) {
        return Math.min(aliveTime, 30_000);    
    }
    return Math.min(aliveTime, 60_000);
}
```
- 对生存时间未足一秒的数据，立即释放
- 否则，按照生存时间延迟释放。生存时间越长的对象价值越大，复活的意义也越大。这就好比更热的数据需要更长的时间来冷却。
  - 对于有参数的数据，最大延迟不得操过半分钟
  - 对于无参数的数据，最大延迟不得操过1分钟

### 2.2 自定义延迟释放

1. 全局覆盖
  ```ts
  const myReleasePolicy = (aliveTime: number, variables: any) => {
      return ...;
  };
  <StateManagerProvider 
      stateManager={...}
      repesePolicy={myReleasePolicy}>
      ...
  </StateManagerProvider>
  ```
2. 单数据覆盖(仅以useStateValue和useQuery为例)
  ```ts
  const myReleasePolicy = (aliveTime: number, variables: any) => {
      return ...;
  };
  useStateValue(asyncStyle, {
      repesePolicy: myReleasePolicy
  });
  useQuery(query$.findBooks(...), {
      repesePolicy: myReleasePolicy
  });
  ```

-----------
[< 上一篇：图状态](./graph-state/README_zh_CN.md) | [返回上级：文档](./README_zh_CN.md) | [下一篇：HTTP优化器>](./http-optimization/README_zh_CN.md)
```
