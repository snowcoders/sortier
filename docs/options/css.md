# Css options

## parser (Default: undefined)

The default parser to use of which there are three options

- undefined - Sortier will determine the parser to use based on the file extension
- "less" - Force sortier to use the less parser
- "scss" - Force sortier to use the scss parser

Example json configuration

```json
{
  "css": {
    "parser": undefined
  }
}
```

## overrides (Default: undefined)

Overrides for sorting groups of css properties

- undefined - Sortier will sort alphabetically
- string[] - List of property names in the order they should be ordered. Use "\*" to match anything that isn't in the list

Example json configuration

```json
{
  "css": {
    "sortDeclarations": {
      "overrides": ["display", "*"]
    }
  }
}
```
