import { cosmiconfigSync } from "cosmiconfig";
import type { CssSortierOptions } from "../language-css/index.js";
import type { JavascriptSortierOptions } from "../language-js/index.js";
import { LogUtils, LoggerVerboseOption } from "../utilities/log-utils.js";

export interface SortierOptions {
  // Default "false". If true, sortier will run but not rewrite any files. Great for testing to make sure your code base doesn't have any weird issues before rewriting code.
  isTestRun?: boolean;

  // Default "normal"
  //  - "quiet" - No console logs
  //  - "normal" - General information (e.g. if sortier was unable to parse a file)
  //  - "diagnostic" - All the above along with type information that sortier was unable to handle (great for opening bugs!)
  logLevel?: "diagnostic" | "normal" | "quiet";

  // Options for the javascript type languages
  js?: JavascriptSortierOptions;

  // Options for the javascript type languages
  css?: CssSortierOptions;
}

/**
 * Resolves and loads the closest sortier config to the filepath provided
 * @param filepath
 * @returns The loaded options or a default options object
 */
export function resolveOptions(filepath: string): SortierOptions {
  const explorer = cosmiconfigSync("sortier", { searchStrategy: "global" });
  const result = explorer.search(filepath);
  const config = result?.config || {};
  const options = config as SortierOptions;

  // Set the LogUtils verbosity based on options
  switch (options?.logLevel) {
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
