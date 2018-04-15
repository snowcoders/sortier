<h1 align="center">Sortier</h1>
<h2 align="center">An opinionated Code Sorter</h2>

[![npm (scoped)](https://img.shields.io/npm/v/@snowcoders/sortier.svg)](https://www.npmjs.com/package/@snowcoders/sortier) 
[![CircleCI branch](https://img.shields.io/circleci/project/github/snowcoders/sortier.svg)](https://circleci.com/gh/snowcoders/sortier)

## Introduction
Sortier is an opinionated code sorter similar to how Prettier is a opinionated code formatter. Given a file, it parses it and figures out how to rearrange items in a consistent way.

It should work with ES6, Flow and Typescript but if you find a piece of code that doesn't sort the way you expect it to, feel free to open an issue in Github!

## General things to keep in mind
 - Blank lines are treated as context breaks... Sortier will not sort through them
 - Inline comments to the right of the code may not be sorted. We suggest putting comments above or infront of code.
 - Comments will stay with the line they comment (see Props example below)
### Input
```
import { 
        a2, 
        a1 } 
        from "./a";
import { 
       /*Absolute imports move to the top*/ c2
} from "c";
import { b3, b1 } from "./b";

// Blank lines act like context barriers and will divide sorting blocks
import { b2 } from "b1";

export type Props = {
  // Prop3 comment
  prop3: string,
  callback2: () => void,
  // Prop1 comment
  prop1: number,
  callback1(): void,
}
```
### Output
```
import { 
       /*Absolute imports move to the top*/ c2
} from "c";
import { 
        a1, 
        a2 } 
        from "./a";
import { b1, b3 } from "./b";

// Blank lines act like context barriers and will divide sorting blocks
import { b2 } from "b1";

export type Props = {
  // Prop1 comment
  prop1: number,
  // Prop3 comment
  prop3: string,
  callback1(): void,
  callback2: () => void,
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
  // Default "false". If true, prints out very verbose lines that sortier doesn't know how to handle so you can open Github issues about them
  isHelpMode?: false | true,

  // Default "false". If true, sortier will run but not rewrite any files. Great for testing to make sure your code base doesn't have any weird issues before rewriting code.
  isTestRun?: false | true,

  // Default undefined. The parser to use. If undefined, sortier will determine the parser to use based on the file extension
  parser?: "flow" | "typescript",

  // Default "source". The order you wish to sort import statements. Source is the path the import comes from. First specifier is the first item imported.
  sortImportDeclarations?: "first-specifier" | "source",

  // Default ["undefined", "null", "*", "object", "function"]. The order to sort object types when encountered.
  sortTypeAnnotations?: ("null" | "undefined" | "*" | "function" | "object")[]
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
