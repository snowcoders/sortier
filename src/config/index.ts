import { cosmiconfigSync } from "cosmiconfig";
import { LogUtils, LoggerVerboseOption } from "../utilities/log-utils.js";
import {
  SortierOptions,
  validateOptions,
  sortierOptionsSchema,
} from "./validate-options.js";

export { SortierOptions, sortierOptionsSchema };

/**
 * Resolves and loads the closest sortier config to the filepath provided
 * @param filepath
 * @returns The loaded options or a default options object
 */
export function resolveOptions(filepath: string): SortierOptions {
  const explorer = cosmiconfigSync("sortier");
  const result = explorer.search(filepath);
  const options = validateOptions(result?.config || {});

  // Set the LogUtils verbosity based on options
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

  return options;
}
