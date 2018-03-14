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
import { b1 } from "b1";

/* Union type example */
export type ButtonType = "small" | "big" | undefined | null | "medium";

/* Switch case example */
switch (1) {
  // This is the first context group
  case 4:
    break;
  case 3: {
    alert(3);
    // Leads into 2
  }
  case 2:
    break;
    
  // This is the second context group
  case 7:
    break;
  case 4:
  case 5:
    break;
}
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

/* Switch case example */
switch (1) {
  // This is the first context group
  case 3: {
    alert(3);
    // Leads into 2
  }
  case 2:
    break;
  case 4:
    break;
    
  // This is the second context group
  case 4:
  case 5:
    break;
  case 7:
    break;
}
```

## Options

We use [cosmiconfig](https://www.npmjs.com/package/cosmiconfig) to determine the current config settings which means you can use
 - a sortier property in your package.json
 - a .sortierrc
 - a sortier.config.js

Configuring your options
 - All sorts are turned on by default (or by setting it to undefined)
 - All sorts can be turned off by setting their options to null
```
{
  isHelpMode: false | true,                             // Default "false". If true, prints out lines that sortier doesn't know how to handle so you can open Github issues about them
  sortExpression: undefined | null,
  sortImportDeclarations: undefined | null | {
    orderBy: "source" | "first_specifier",              // Default "source". Source is the module path the import is from, first specifier is the first imported item name
  },
  sortImportDeclarationSpecifiers: undefined | null,
  sortSwitchCase: undefined | null,
  sortUnionTypeAnnotation: undefined | null,
  sortVariableDeclarator: undefined | null,
  parser?: "flow" | "typescript"                        // Default undefined. The parser to use. If undefined, sortier will determine the parser to use based on the file extension
}
```
And more to come!

## How to run it
```
sortier [glob-file-path]
```

## Pre-commit Hook
We went with a system similar to [prettier](https://prettier.io/docs/en/precommit.html) so hopefully you have already picked a solution and can keep going with it. If not, this repository uses `lint-staged` and `husky`

1. Run `npm install --save-dev lint-staged husky`
2. Add the following to your package.json
```
{
  "scripts": {
    "precommit": "lint-staged"
  },
  "lint-staged": {
    "**/*.js": [
      "sortier",
      "git add"
    ]
  }
}
```
