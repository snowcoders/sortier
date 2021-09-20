# About

## What is Sortier?

Sortier is a code sorting tool with support for:

- Javascript ES6+
- JSX
- Typescript
- Flow
- HTML
- JSON
- More being added!

It reads the source code and reorders the contents and ensures that all source code has the consistent ordering.
Example

Take the following tsconfig file from our own repository:

```json
{
  "compilerOptions": {
    "outDir": "./dist/",
    "sourceMap": true,
    "module": "es6",
    "target": "es2015",
    "moduleResolution": "node",
    "jsx": "react",
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noImplicitAny": true,
    "experimentalDecorators": true,
    "noUnusedLocals": true,
    "forceConsistentCasingInFileNames": true,
    "strictNullChecks": true,
    "preserveConstEnums": true
  },
  "include": ["./src/**/*.ts", "./src/**/*.tsx"],
  "exclude": ["./src/**/*.test.ts", "./src/**/*.test.tsx"]
}
```

After running Sortier, it will be rewritten like this:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react",
    "module": "es6",
    "moduleResolution": "node",
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "outDir": "./dist/",
    "preserveConstEnums": true,
    "sourceMap": true,
    "strictNullChecks": true,
    "target": "es2015"
  },
  "exclude": ["./src/**/*.test.ts", "./src/**/*.test.tsx"],
  "include": ["./src/**/*.ts", "./src/**/*.tsx"]
}
```

# So how is this useful?

Well if two developers add the same property you will often get a merge conflict or worse no conflict at all! Since sortier sorts and orders the properties, it makes it easier for git to find merge issues along with visually to find duplicates when debugging issues.

Further, because the values are now sorted, it's faster for developers to read and get to the piece of information they intended to find
So what exactly gets sorted?

This varies language to language and as more features get added on, I'm sure more things will be sorted over time. Some examples of what will be sorted are:

- HTML
  - Attributes
- Javascript/Flow/Typescript
  - Properties within interfaces
  - Properties within objects
  - Properties within types
  - Import statements and specifiers
  - Export statements and specifiers
  - Case statements within a switch
  - Union definitions
  - Some binary expressions
- JSX
  - Properties within an element
- JSON files
  - Properties
