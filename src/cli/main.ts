import * as cosmiconfig from "cosmiconfig";
import { sync } from "globby";

import { Reprinter } from "../reprinter";
import { ReprinterOptions } from "../reprinter-options";
import { LoggerVerboseOption, LogUtils } from "../utilities/log-utils";

export class Main {
  public run(args: string[]) {
    if (args.length === 0) {
      LogUtils.log(
        LoggerVerboseOption.Normal,
        "Must provide a file pattern to run sortier over"
      );
      return -1;
    }

    const explorer = cosmiconfig("sortier");
    const result = explorer.searchSync();
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

    if (result == null) {
      LogUtils.log(
        LoggerVerboseOption.Diagnostic,
        "No valid sortier config file found. Using defaults..."
      );
    }

    sync(args).map(filePath => {
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
