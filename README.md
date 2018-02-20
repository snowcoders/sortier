<h1 align="center">Sortier</h1>
<h2 align="center">An opinionated Code Sorter</h2>

[![npm (scoped)](https://img.shields.io/npm/v/@snowcoders/sortier.svg)](https://www.npmjs.com/package/@snowcoders/sortier) 
[![CircleCI branch](https://img.shields.io/circleci/project/github/snowcoders/sortier.svg)](https://circleci.com/gh/snowcoders/sortier)

## Introduction
Sortier (German for Sort) is an opinionated code sorter similar to how Prettier is a opinionated code formatter. Given a file, it parses it and figures out how to rearrange items in a consistent way.

### Input
```
import { 
        a2, 
        a1 } 
        from "./a";
import { b2, b1 } from "./b";
import { 
        c2, 
        c1 } from "c";
```
### Output
```
import { 
        a1, 
        a2 } 
        from "./a";
import { b1, b2 } from "./b";
import { 
        c1, 
        c2 } from "./c";
```

## Options

We use [cosmiconfig](https://www.npmjs.com/package/cosmiconfig) to determine the current config settings which means you can use
 - a sortier property in your package.json
 - a .sortierrc
 - a sortier.config.js

Configuring your options
```
{
  "sortImportDeclarations": {
    "orderBy: "alpha"                           // Default "alpha"
  },
  "sortImportDeclarationSpecifiers": {
    groups: ("*" | "types" | "interfaces")[],   // Default ["*", "types", "interfaces"] - Note that "*" is everything that isn't a type or an interface
    orderBy: "alpha"                            // Default "alpha"
  }
}
```