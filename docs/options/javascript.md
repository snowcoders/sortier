# Javascript options

## parser (Default: undefined)

The default parser to use of which there are three options

- undefined - Sortier will determine the parser to use based on the file extension
- "flow" - Force sortier to always use the flow parser
- "typescript" - Force sortier to always use the typescript parser

### Example json configuration

```json
{
  "js": {
    "parser": undefined
  }
}
```

## sortImportDeclarations (Default: "source")

The order to sort import declarations

- undefined - Sortier will determine the parser to use based on the file extension
- "source" - Uses the import path to order the imports
- "first-specifier" - Uses the first imported specifier to order the imports

### Example json configuration

```json
{
  "js": {
    "sortImportDeclarations": "source"
  }
}
```

## sortTypeAnnotations (Default: ["undefined", "null", "*", "function"])

The order of properties within types and objects. This affects an array of types such as unions, binary expressions, objects and more.

- "undefined" - Matches the actual value of undefined
- "null" - Matches the actual value of null
- "function" - Matches all function types (arrow and method)
- "object" - Matches all inline object definitions
- "\*" - Matches anything else that is not defined in the array. If not supplied, this value will be appended to the end of the arary

## Union example

A simple example of how this works with union types is as follows:

```typescript
type PageOption = "Home" | null | undefined | "Options";
```

Is rewritten to:

```typescript
type PageOption = undefined | null | "Home" | "Options";
```

## Object and type example

As for objects and types:

```typescript
interface CustomReactProps {
  preventUpdates?: boolean;
  onNameChange: (newName: string) => void;
  onDescriptionChange(newDescription: string): void;
  name?: string;
  description?: string | null;
}
```

Is rewritten to:

```typescript
interface CustomReactProps {
  description?: null | string;
  name?: string;
  preventUpdates?: boolean;
  onDescriptionChange(newDescription: string): void;
  onNameChange: (newName: string) => void;
}
```

### Example json configuration

```json
{
  "js": {
    "sortTypeAnnotations": ["undefined", "null", "*", "object", "function"]
  }
}
```

## sortContents (Default: undefined)

WARNING: In beta - More test cases are required. Please try this out yourself and provide feedback, the more we get, the better the feature!

Sorts all class content by groupings (static, constructor, properties then functions) then by access modifiers (public, protected, private)

By default this feature is turned off because it sorts through blank lines which goes against our initial documentation

Static properties are always sorted by usage and then the provided order. This is because static properties run on load and changing the ordering of the dependencies may cause runtime changes.

The options available are

- order - The order you wish to arrange the class contents
  - "alpha" - Order alphabetically
  - "usage" - Order by usage based on reading from the top of the document down
- isAscending - true to sort in order (e.g. for "alpha" a-z) or false for reverse
- overrides - Array of function names you wish to explicitly define their location. Note that "\*" will match anything not listed.

### Example json configuration

```json
{
  "js": {
    "sortContents": {
      "isAscending": true,
      "order": "usage",
      "overrides": [
        // Overrides for react components
        "getDerivedStateFromProps",
        "componentWillMount",
        "componentDidMount",
        "shouldComponentUpdate",
        "componentWillUnmount",
        "componentDidUnmount",
        "render",
        "*"
      ]
    }
  }
}
```
