# Sortier

An opinionated Code Sorter

[![npm (scoped)](https://img.shields.io/npm/v/sortier.svg)](https://www.npmjs.com/package/sortier)

Sortier is an opinionated code sorter similar to how Prettier is a opinionated code formatter. Given a file, it parses then sorts and rearranges source code in a consistent way.

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
- Comments will stay with the line they comment unless there is only one comment above all the lines of code

### Example Input

```
// Imports are ordered by path
// ImportSpecifiers are also ordered

import {
    /* a2 comment */
    a2,
    /* a1 comment */
    a1 } from "./a";
// c2 import comment
import { c2 } from "c";
import { b3, b1 } from "./b";

// Blank lines act like context barriers and will divide sorting blocks
import { b2 } from "b1";

export type Props = {
  // Prop3 comment
  prop3: string;
  callback2: () => void;
  // Prop1 comment
  prop1: number;
  callback1(): void;

  // Since this is the only comment for this context block, this comment stays where it is
  prop4: boolean;
  prop2: boolean;
};

```

### Example Output

```
// Imports are ordered by path
// ImportSpecifiers are also ordered

// c2 import comment
import { c2 } from "c";
import {
    /* a1 comment */
    a1,
    /* a2 comment */
    a2 } from "./a";
import { b1, b3 } from "./b";

// Blank lines act like context barriers and will divide sorting blocks
import { b2 } from "b1";

export type Props = {
  // Prop1 comment
  prop1: number;
  // Prop3 comment
  prop3: string;
  callback1(): void;
  callback2: () => void;

  // Since this is the only comment for this context block, this comment stays where it is
  prop2: boolean;
  prop4: boolean;
};

```

## Options

- [Configuration](https://snowcoders.github.io/sortier/#/options/configuration)

- [General options](https://snowcoders.github.io/sortier/#/options/general)

- [Javascript/Flow/Typescript options](https://snowcoders.github.io/sortier/#/options/js)

- [Css/Scss/Less options](https://snowcoders.github.io/sortier/#/options/css)

And more to come!

## Pre-commit Hook

See our [Install](https://snowcoders.github.io/sortier/#/usage/install) documentation

## Contributing

See [./CONTRIBUTING.md](./CONTRIBUTING.md)
