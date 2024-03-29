# General options

## logLevel (Default: "normal")

Determines the amount of logging that is outputted to the console. There are three options:

- "quiet" - Log nothing to the console
- "normal" - General information (e.g. if sortier was unable to parse a file)
- "diagnostic" - Log detailed information regarding scenarios sortier was unable to handle

Example json configuration

```json
{
  "logLevel": "diagnostic"
}
```

## isTestRun (Default: false)

When false, sortier will rewrite existing files in place. When true, the files will not be rewritten but sortier will run.

Example json configuration

```json
{
  "isTestRun": false
}
```
