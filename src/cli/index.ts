import cosmiconfig from "cosmiconfig";
import { sync } from "globby";

import { Reprinter } from "../reprinter";
import { ReprinterOptions } from "../reprinter-options";
import { LoggerVerboseOption, LogUtils } from "../utilities/log-utils";

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
    sync(args).map(filePath => {
      if (options == null) {
        options = getConfig(filePath);
      }

      try {
        Reprinter.rewrite(filePath, options);
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
  let options = result == null ? {} : (result.config as ReprinterOptions);

  // Set the LogUtils verbosity based on options
  if (options.isHelpMode) {
    LogUtils.setVerbosity(LoggerVerboseOption.Diagnostic);
  }
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

  return options;
}
