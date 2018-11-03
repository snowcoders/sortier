import * as cosmiconfig from "cosmiconfig";
import { sync } from "globby";

import { Logger, LoggerVerboseOption } from "../logger";
import { Reprinter, ReprinterOptions } from "../reprinter";

export class Main {
  public run(args: string[]) {
    if (args.length === 0) {
      Logger.log(
        LoggerVerboseOption.Normal,
        "Must provide a file pattern to run sortier over"
      );
      return -1;
    }

    const explorer = cosmiconfig("sortier");
    const result = explorer.searchSync();
    let options = result == null ? {} : (result.config as ReprinterOptions);

    // Set the Logger verbosity based on options
    if (options.isHelpMode) {
      Logger.setVerbosity(LoggerVerboseOption.Diagnostic);
    }
    if (options.logLevel != null) {
      switch (options.logLevel) {
        case "diagnostic":
          Logger.setVerbosity(LoggerVerboseOption.Diagnostic);
          break;
        case "quiet":
          Logger.setVerbosity(LoggerVerboseOption.Quiet);
          break;
        default:
          Logger.setVerbosity(LoggerVerboseOption.Normal);
          break;
      }
    }

    if (result == null) {
      Logger.log(
        LoggerVerboseOption.Diagnostic,
        "No valid sortier config file found. Using defaults..."
      );
    }

    sync(args).map(filePath => {
      try {
        Reprinter.rewrite(filePath, options);
      } catch (e) {
        Logger.log(LoggerVerboseOption.Normal, "");
        Logger.log(
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
