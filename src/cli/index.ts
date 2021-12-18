import { globbySync } from "globby";
import { UnsupportedExtensionError } from "../error/unsupported-extension-error.js";
import { formatFile } from "../lib/format-file/index.js";
import { LogUtils, LoggerVerboseOption } from "../utilities/log-utils.js";

export function run(args: string[]) {
  {
    if (args.length === 0) {
      LogUtils.log(
        LoggerVerboseOption.Normal,
        "Must provide a file pattern to run sortier over (e.g. `sortier ./**/*.ts`)"
      );
      return -1;
    }

    const files = globbySync(args);
    let error = null;
    if (files.length === 0) {
      if (args[0].indexOf("\\") !== -1) {
        LogUtils.log(
          LoggerVerboseOption.Normal,
          "Sortier no longer supports file paths that contain '\\' (see fast-glob@3.0.0 release notes). Is your glob pattern correct?"
        );
      } else {
        LogUtils.log(
          LoggerVerboseOption.Normal,
          "No filepaths found for file pattern"
        );
      }
    }
    files.map((filePath) => {
      try {
        formatFile(filePath);
      } catch (e) {
        const message = `Sorting ${filePath} has failed: ${getStringFromError(
          e
        )}`;

        // Decrease verbosity if the file is an extension we don't support
        if (e instanceof UnsupportedExtensionError) {
          LogUtils.log(LoggerVerboseOption.Diagnostic, message);
        } else {
          error = e;
          LogUtils.log(LoggerVerboseOption.Normal, message);
        }
      }
    });

    if (error != null) {
      return -1;
    }

    return 0;
  }
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
