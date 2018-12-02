### Unreleased

- Added JSON sorting
- Fixed sorting values within array expressions
- Added sorting class contents. This is disabled by default due to breaking our original rule of not sorting across blank lines. It can be enabled by setting the `sortClassContents` property via the settings
- Created a `js` property for configs so that all javascript related options are grouped. **Important** - We recommend you move to using this structure as in v3.0.0 the properties relating specifically to javascript will be removed from the root of the config.
- Removed treatment of objects differentl when sorting properties within an object

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
