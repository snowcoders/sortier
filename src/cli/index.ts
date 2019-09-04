import cosmiconfig from "cosmiconfig";
import { sync } from "globby";

import { Reprinter } from "../reprinter";
import { ReprinterOptions } from "../reprinter-options";
import { LogUtils, LoggerVerboseOption } from "../utilities/log-utils";

export function run(args: string[]) {
  {
    if (args.length === 0) {
      LogUtils.log(
        LoggerVerboseOption.Normal,
        "Must provide a file pattern to run sortier over (e.g. `sortier ./**/*.ts`)"
      );
      return -1;
    }

    let options: null | ReprinterOptions = null;
    let files = sync(args);
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
    files.map(filePath => {
      if (options == null) {
        options = getConfig(filePath);
      }

      try {
        Reprinter.rewriteFile(filePath, options);
      } catch (e) {
        LogUtils.log(LoggerVerboseOption.Normal, "");
        LogUtils.log(
          LoggerVerboseOption.Normal,
          `Sorting ${filePath} has failed!
If this is an issue with sortier please provide an issue in Github with minimal source code to reproduce the issue
${e}`
        );
      }
    });

    return 0;
  }
}

function getConfig(filename: string): ReprinterOptions {
  const explorer = cosmiconfig("sortier");
  const result = explorer.searchSync(filename);
  let config = result == null ? {} : result.config;
  let options = config as ReprinterOptions;

  // Set the LogUtils verbosity based on options
  if (options.logLevel != null) {
    switch (options.logLevel) {
      case "diagnostic":
        LogUtils.setVerbosity(LoggerVerboseOption.Diagnostic);
        break;
      case "quiet":
        LogUtils.setVerbosity(LoggerVerboseOption.Quiet);
        break;
      default:
        LogUtils.setVerbosity(LoggerVerboseOption.Normal);
        break;
    }
  }

  if (config["isHelpMode"] != null) {
    LogUtils.log(
      LoggerVerboseOption.Normal,
      `Config property 'isHelpMode' has been replaced with 'logLevel'. Please upgrade your config file.`
    );
  }
  for (let removedProperty of [
    "parser",
    "sortClassContents",
    "sortImportDeclarationSpecifiers",
    "sortImportDeclarations",
    "sortTypeAnnotations"
  ]) {
    if (config[removedProperty] != null) {
      LogUtils.log(
        LoggerVerboseOption.Normal,
        `Config property '${removedProperty}' has been moved in 3.0.0 to the 'js' property. Please upgrade your config file.`
      );
    }
  }

  return options;
}
