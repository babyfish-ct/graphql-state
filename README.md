![image](./chrome-extension/public/images/128_128.png "Logo")
# An intelligent react state management framework

#### Language: English | [Chinese](./README_zh_CN.md)

## Video introduction
[https://www.youtube.com/watch?v=05Xx_t8GC18](https://www.youtube.com/watch?v=05Xx_t8GC18)
*(Sorry, English is not good, so I use AI to synthesize speech)*

## Project description

What is the essence of UI state?
> One main mutation causes **N** extra mutations. The more complex the UI, the larger the **N**.

*(If you have ever developed more complex UI, you will resonate with it. If not, don’t worry, let's discuss it together in the [Project context](./site/background.md).)*

This is the essence of UI state, also the biggest trouble of UI development.

**This framework allows developers to focus only on the main mutation, extra mutations are handled automatically.**

*Compare with [Apollo client](https://github.com/apollographql/apollo-client) and [Relay](https://github.com/facebook/relay), after mutation, you only need to save the main mutation into local cache. Neither need to manually change other affected data in the local cache, nor need to specify which queries will be affected and need to be refetched, because of all the extra mutations is handled automatically.*

## About REST

The project name is "graphql-state". Don't worry, it's **"GraphQL style, but not GraphQL only"**, it can map REST service to GraphQL service.

## Table of contents
- [Project context](./site/background.md)
- [Functions and GIF animation demonstrations](./site/function-and-gif.md)
- [Get start](./site/get-start.md)
- [Run attached demos](./site/run-demo.md)
- [Documentation](./doc/README.md)

## Chrome extension

In order to help developers debug, this framework supports [chrome extension](https://chrome.google.com/webstore/detail/graphql-state/bhpeanmgkcpkpnkpmemoomlfflmaaddo).

## Dependencies
[graphql-ts-client](https://github.com/babyfish-ct/graphql-ts-client)(3.1.11+), TypeScript DSL for GraphQL
