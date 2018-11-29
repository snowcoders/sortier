### Unreleased

- Added JSON sorting
- Fixed sorting values within array expressions
- Added sorting class contents. This is disabled by default due to breaking the original rule of not sorting across blank lines.

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
