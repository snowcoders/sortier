import { JavascriptReprinterOptions } from "./language-js";

// TODO: v3.0.0 - Remove extends JavascriptReprinterOptions
export interface ReprinterOptions extends JavascriptReprinterOptions {
  // Default "false". If true, prints out very verbose lines that sortier doesn't know how to handle so you can open Github issues about them
  isHelpMode?: boolean;

  // Default "false". If true, sortier will run but not rewrite any files. Great for testing to make sure your code base doesn't have any weird issues before rewriting code.
  isTestRun?: boolean;

  // Default "normal". This overrides isHelpMode if set.
  //  - "quiet" - No console logs
  //  - "normal" - General information (e.g. if sortier was unable to parse a file)
  //  - "diagnostic" - All the above along with type information that sortier was unable to handle (great for opening bugs!)
  logLevel?: "diagnostic" | "normal" | "quiet";

  // Options for the javascript type languages
  js?: JavascriptReprinterOptions;
}
