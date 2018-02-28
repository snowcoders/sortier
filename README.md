<h1 align="center">Sortier</h1>
<h2 align="center">An opinionated Code Sorter</h2>

[![npm (scoped)](https://img.shields.io/npm/v/@snowcoders/sortier.svg)](https://www.npmjs.com/package/@snowcoders/sortier) 
[![CircleCI branch](https://img.shields.io/circleci/project/github/snowcoders/sortier.svg)](https://circleci.com/gh/snowcoders/sortier)

## Introduction
Sortier is an opinionated code sorter similar to how Prettier is a opinionated code formatter. Given a file, it parses it and figures out how to rearrange items in a consistent way.

It should work with ES6, Flow and Typescript but if you find a piece of code that doesn't sort the way you expect it to, feel free to open an issue in Github!

### Input
```
/* Import example */
import { 
        a2, 
        a1 } 
        from "./a";
import { 
        c2, 
        c1 } from "c"; // Inline comments will move with the import
import { b2, b1 } from "./b";

// Line comments and blank lines act like syntax barriers and will divide sorting blocks
import { c1 } from "c1";

/* Union type example */
export type ButtonType = "small" | "big" | undefined | null | "medium";
```
### Output
```
/* Import example */
import { 
        a1, 
        a2 } 
        from "./a";
import { b1, b2 } from "./b";
import { 
        c1, 
        c2 } from "c"; // Inline comments will move with the import

// Line comments and blank lines act like syntax barriers and will divide sorting blocks
import { b1 } from "b1";

/* Union type example */
export type ButtonType = undefined | null | "big" | "medium" | "small";
```

## Options

We use [cosmiconfig](https://www.npmjs.com/package/cosmiconfig) to determine the current config settings which means you can use
 - a sortier property in your package.json
 - a .sortierrc
 - a sortier.config.js

Configuring your options
```
{
  sortImportDeclarationSpecifiers: {
    groups: ("*" | "types" | "interfaces")[],   // Default ["*", "types", "interfaces"] - Note that "*" is everything not defined
  },
  sortImportDeclarations: {
    orderBy: "source" | "first_specifier",     // Default "source". Source is the module path the import is from, first specifier is the first imported item name
  },
  sortUnionTypeAnnotation: {
    groups: ("*" | "undefined" | "null")[],     // Default ["undefined", "null", "*"] - Note that "*" is everything not defined
  },
  sortExpression: {
    groups: ("*" | "undefined" | "null")[],     // Default ["undefined", "null", "*"] - Note that "*" is everything not defined
  },
  isHelpMode: false | true                    // Default "false". If true, prints out lines that sortier doesn't know how to handle so you can open Github issues about them
}
```

And more to come!