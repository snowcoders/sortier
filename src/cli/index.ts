import { globbySync } from "globby";
import { resolveOptions } from "../config/index.js";
import { IgnoredFileError } from "../error/ignored-file-error.js";
import { UnsupportedExtensionError } from "../error/unsupported-extension-error.js";
import { formatFile } from "../lib/format-file/index.js";
import { LogUtils, LoggerVerboseOption } from "../utilities/log-utils.js";
import { parseArgs } from "./args-parser.js";

export function run(args: string[]) {
  const context = parseArgs(args);
  resolveOptions(process.cwd());

  if (context.filepatterns.length === 0) {
    LogUtils.log(
      LoggerVerboseOption.Normal,
      "Must provide a file pattern to run sortier over (e.g. `sortier --ignore-unknown './**/*.ts'`)"
    );
    return 1;
  }

  const files = globbySync(context.filepatterns, {
    dot: true,
  });
  if (files.length === 0) {
    if (context.filepatterns[0].indexOf("\\") !== -1) {
      LogUtils.log(
        LoggerVerboseOption.Normal,
        "Sortier no longer supports file paths that contain '\\' (see fast-glob@3.0.0 release notes). Is your glob pattern correct?"
      );
    } else {
      LogUtils.log(
        LoggerVerboseOption.Normal,
        `No filepaths found for file pattern(s) ${context.filepatterns.map((value) => `"${value}"`).join(" ")}`
      );
    }
    return 1;
  }

  let error = null;
  files.map((filePath) => {
    const start = Date.now();
    try {
      formatFile(filePath);
      const end = Date.now();
      const measured = end - start;
      LogUtils.log(LoggerVerboseOption.Normal, `${filePath} - ${measured}ms`);
    } catch (e) {
      const end = Date.now();
      const measured = end - start;
      let level = LoggerVerboseOption.Normal;
      let shouldPrint = true;

      if (e instanceof IgnoredFileError) {
        level = LoggerVerboseOption.Diagnostic;
      } else if (e instanceof UnsupportedExtensionError && context.ignoreUnknown) {
        shouldPrint = false;
      } else {
        error = e;
      }
      if (shouldPrint) {
        LogUtils.log(level, `${filePath} - ${getStringFromError(e)} - ${measured}ms`);
      }
    }
  });

  if (error != null) {
    return 1;
  }

  return 0;
}

function getStringFromError(e: unknown) {
  if (e instanceof Error) {
    const { message } = e;
    return message;
  } else if (typeof e === "string") {
    return e;
  }
  return e;
}
