# Sortier

An opinionated Code Sorter

[![npm (scoped)](https://img.shields.io/npm/v/@snowcoders/sortier.svg)](https://www.npmjs.com/package/@snowcoders/sortier) [![CircleCI branch](https://img.shields.io/circleci/project/github/snowcoders/sortier/master.svg)](https://circleci.com/gh/snowcoders/sortier) [![Coverage Status](https://coveralls.io/repos/github/snowcoders/sortier/badge.svg?branch=master)](https://coveralls.io/github/snowcoders/sortier?branch=master)

Sortier is an opinionated code sorter similar to how Prettier is a opinionated code formatter. Given a file, it parses then figures out how to sort and rearrange source code in a consistent way.

[Documentation](http://snowcoders.github.io/sortier)

Examples of what sortier will sort in JavaScript:

- Import statements
- Import specifiers
- Union types
- Keys and properties within objects and types
- React JSX properties
- And more!

It should work with JavaScript ES6, Flow, Typescript, HTML and Json but if you find a piece of code that after sorting doesn't look as expected, feel free to open an issue in Github!

## How to run it

```
sortier "[glob-file-path]"
```

## General things to keep in mind

- Blank lines are treated as context breaks... Sortier will not sort through them
- Inline comments to the right of the code may not be sorted. We suggest putting comments above or in front of code.
- Comments will stay with the line they comment (see Props example below)

### Example Input

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

### Example Output

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

- [Configuration](https://snowcoders.github.io/sortier/#/configuration)

- [General options](https://snowcoders.github.io/sortier/#/options-general)

- [Javascript/Flow/Typescript options](https://snowcoders.github.io/sortier/#/options-js)

And more to come!

## Pre-commit Hook

See our [Install](https://snowcoders.github.io/sortier/#/install) documentation
