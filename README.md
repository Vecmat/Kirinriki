<p align="center">
  <pre style="font-size: 6px; text-align: center;">
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
    <a href="https://gitter.im/_rakkit_/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge">
      <img src="https://badges.gitter.im/_rakkit_/community.svg">
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

## Features

Fire-new error catcher!  
Support global throw and catching!   

```typescript
// ApiControler.ts
@Catching("API_*")
async catcherr(err: Exception, ctx: IContext) {
    console.log(err.sign);
    return false;
}

@Post("/test")
async test(@Ctx() ctx: IContext) {
    throw new Exception("API_DEMO_ERROR","Demo error info")
}

```

Decorator Support  
Hybrid Protocol (`HTTP`/ `WS` /`GRPC`)  


## Specific Definition

`Action` like to service, it is related to requests and can read `ctx` attributes

