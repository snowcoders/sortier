### Unreleased

- Bug fixes
  - Fixed typescript generics being mistaken for JSX elements
  - Fixed incorrect sorting of typescript union types
  - Fixed switch statement bug when there is only one case statement per context group
  - Fixed switch statement bug where it wouldn't sort if there was a conditional inside the case
- New support
  - JSXFragment
  - ArrayPattern
  - JSXEmptyExpression
- Breaking

  - Error handling changes
    - Non-supported files no longer throw exceptions. Now we only output a dianostic level log message (yay easier glob formats)
    - Returns non-zero exit code if sorting any one file fails which should force lint-staged to fail via hooks
  - From the root exports removed `format` in favor of `formatFile`
  - Updated globby@10.0.0 which [only allows forward slashes in paths](https://github.com/mrmlnc/fast-glob#pattern-syntax)
    - Fix: If you were running `sortier ".\**\*.ts"` you'll need to update to `sortier "./**/*.ts"`
  - Configuration file updates

    - Removed `isHelpMode: true` in favor of `logLevel: diagnostic`
    - Removed javascript options from the root

      - Fix: In the root of your configuration file, if you had any of the javascript specific options you should move them into a js object. For example, migrating from:

        ```
        {
          parser: 'typescript',
          sortClassContents: {},
          sortImportDeclarationSpecifiers: {},
          sortImportDeclarations: {},
          sortTypeAnnotations: {}
        }
        ```

        To

        ```
        {
          js: {
            parser: 'typescript',
            sortClassContents: {},
            sortImportDeclarationSpecifiers: {},
            sortImportDeclarations: {},
            sortTypeAnnotations: {}
          }
        }
        ```

### 2.6.2

- Added `sortImportDeclarationSpecifiers` to the public options (Thanks @abrougher for the bug)

### 2.6.1

- Improved `.sortierignore` file support for monorepos by using the closest .sortierignore file

### 2.6.0

- Added `.sortierignore` file support (Thanks @TikiTDO)

### 2.5.4

- Moved from `typescript-estree` to `@typescript-eslint/typescript-estree` as the former has been deprecated

### 2.5.3

- Switched from `localeCompare` to comparison operator to sort by Unicode value instead of locale (Thanks @trevorr for the suggestion)
- Fixed error when object property keys are numbers instead of strings (Thanks @trevorr for the bug)

### 2.5.2

- Fixed ordering of json properties to ignore quotes
- Fixed line endings for `bin/index.js`

### 2.5.1

- Added formatText and formatFile functions to exports for non-cli support
- `script` and `style` tags in html files are now sorted
- Increased performance

### 2.5.0

- We now move comments to the right of a line when sorting not just to the top and to the left
- Improved handling of switch statements

### 2.4.0

- Added `css`, `scss` and `less` file support
- Upgraded typescript-estree@7.0.0
- Fixed dependent static property sort for javascript's sortClassContents
- Fixed sorting objects with semicolons as line separators
- Fixed parenthesis not moving with BinaryExpression sort
- Fixed case statement sort with more complex case statement test values

### 2.3.2

- Added documentation website and referenced it from readme.md
- Fixed bug regarding case statement sorting within a switch statement

### 2.3.1

- Fixed missing dependency (angular-html-parser)

### 2.3.0

- Added JSON sorting
- Added sorting class contents. This is disabled by default due to breaking our original rule of not sorting across blank lines. It can be enabled by setting the `sortClassContents` property via the settings
- Fixed sorting values within array expressions
- Created a `js` property for configs so that all javascript related options are grouped.
  - We highly recommend you move to using this structure as in v3.0.0 the properties relating specifically to javascript will be removed from the root of the config.
- Removed treating objects differently when sorting properties within an object to reduce confusion

### 2.2.0

- Added HTML attribute sorting
- Fixed sorting case statements that contain expressions
- Added verbosity logger for easier logging management
  - Moved missing config message to Diagnostic level
  - Added a `logLevel` option to the config to allow for a quiet mode. Setting this to `diagnostic` is the same as setting `isHelpMode` to true.

### 2.1.14

- Implemented sorting of JSXExpressionContainers
- Cleaned up dev dependencies to fix up `npm audit`

### 2.1.13

- Fixed issue with nested JSX elements not being sorted
