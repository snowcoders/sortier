# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2023-02-10

- Added `--ignore-unknown` flag support so sortier can return an exit code of 0 on files it doesn't support. For those using lint-staged, your config can be simplified to something like:
  ```json
  {
    "*": ["prettier --ignore-unknown --write", "sortier --ignore-unknown"]
  }
  ```
- Better console output now prints each matched file, any errors if encountered, and the time it takes to sort that file. For example running `sortier "*{package,sortier}*"` in this repository prints:
  ```
  .sortierignore - No parser could be inferred - 2ms
  .sortierrc.cjs - 28ms
  package.json - 23ms
  ```
- **Breaking**
  - Fixed dot files being skipped
  - `formatFile` throws an error when run on an ignored filepath
  - Dropped support for node 12 and 14, only support >=16

## [1.0.1] - 2021-12-22

- Fixed bug where imports would be mangled intermittently (depends on version of parser that is installed)

## [1.0.0] - 2021-12-19

### Breaking from @snowcoders/sortier@3

- Sortier is now written in ESM which means
  - We only support node versions "^12.20.0 || ^14.13.1 || >=16.0.0"
  - You might be required to use the `--experimental-vm-modules` flag
- JS parsing will now default to using the `typescript` parser. If you use flow, you'll need to explicitly configure sortier to use flow by setting `js.parser: "flow"` in your config.
- Changed `options.js.sortClassContents` to `options.js.sortContents`. In the future we might support sorting functions within a file and they will share the same sort criteria.
- Renamed type `ReprinterOptions` to `SortierOptions`
- Functions `formatFile` and `formatText` both now throw errors if a file does not have a supported parser.

### Other changes

- Refactored Import/Export declarations sorting to handle comments more consistently with the rest of the program.
  - If there is one comment above the group, it's considered a comment for the whole group
  - If there are 2+ comments in the group, those comments will be assumed to be tied to the item either below or to the left of the comment
- Removed sorting of all BinaryExpressions. Honestly we got a lot of feedback that this wasn't super useful and the risk of bugs was higher than the benefit. We can revisit if others voice alternative opinions.
- Fixed bug where sorting nodes at the very beginning or very end with comments would result in incorrect output
- Added `resolveOptions` to resolve the options for a given filepath
- Added `isIgnored` to determine if a given file path is ignored
- Improved error output for cli
- Fixed exit code not 0 when encountering unsupported file types (instead we should just skip them)
