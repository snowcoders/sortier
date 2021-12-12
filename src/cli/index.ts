import { globbySync } from "globby";
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
        error = e;
        LogUtils.log(LoggerVerboseOption.Normal, "");
        LogUtils.log(
          LoggerVerboseOption.Normal,
          `Sorting ${filePath} has failed!
If this is an issue with sortier please provide an issue in Github with minimal source code to reproduce the issue
${e}`
        );
      }
    });

    if (error != null) {
      throw error;
    }

    return 0;
  }
}
