<p align="center">
  <pre align="center" style="font-size: 6px;">
  _    _      _            _ _    _ 
 | |  (_)    (_)          (_) |  (_)
 | | ___ _ __ _ _ __  _ __ _| | ___ 
 | |/ / | '__| | '_ \| '__| | |/ / |
 |   <| | |  | | | | | |  | |   <| |
 |_|\_\_|_|  |_|_| |_|_|  |_|_|\_\_|
                                    
 == https://github.com/vecmat == 
 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌑 
 </pre>
  <p align="center">
    <a href="https://www.npmjs.com/package/kirinriki">
      <img src="https://badge.fury.io/js/kirinriki.svg">
    </a>
    <a href="https://bundlephobia.com/result?p=kirinriki@latest">
      <img src="https://badgen.net/bundlephobia/min/kirinriki">
    </a>
    <a href="https://discord.gg/XpVjCQCe">
      <img src="https://img.shields.io/badge/Chat_in-Discord-blue">
    </a>
  </p>
</p>

# Kirinriki

> Attention!!! REST API officially available, WS/GRpc waiting for adaptation!

A framework written in TypeScript that provides REST/GRPC/Websocket API to build amazing server-side applications!

## Naming

`Kirinriki` is a Pokémon!  
It is a word with palindrome in multiple languages.Like as koa's onion skin model.

Chinese: `麒麟麒`  
English: `Girafarig`  
Thai: `คิรินริกิ` `Kirinriki`  
Korean:  `키링키` `Kirinriki`  
Japanese: `キリンリキ` `Kirinriki`  

## Why Create?

Koa is a streamlined and user-friendly framework,I used it for ten years. But JavaScript can no longer meet my work needs, and I need a better koa framework to match Typescript!
Kirinriki retains important features of koa. Support global middleware and routing middleware, and support custom annotations for routing middleware control.Supports plugins and provides a rich system of event.

## Features

Fire-new error catcher!  
Support global throw and catching!   

```typescript
// ApiControler.ts
@Catching("API_*")
async catchapierr(err: Exception, ctx: IContext) {
    console.log(err.sign);
    // do more thing
    return false;
}

@Post("/test")
async test(@Ctx() ctx: IContext) {
    throw new Exception("API_DEMO_ERROR","Demo error info")
}

```

Decorator Support  
Hybrid Protocol (`HTTP`/ `WS` /`GRPC`)  


## 🔨 Features 



## 🚀 Getting started  
```
npm i kirinriki
```
```
yarn add kirinriki
```

## 📜 Documentation
The documentation is pending 