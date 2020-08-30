import { CssReprinterOptions } from "./language-css";
import { JavascriptReprinterOptions } from "./language-js";

export interface ReprinterOptions {
  // Default "false". If true, sortier will run but not rewrite any files. Great for testing to make sure your code base doesn't have any weird issues before rewriting code.
  isTestRun?: boolean;

  // Default "normal"
  //  - "quiet" - No console logs
  //  - "normal" - General information (e.g. if sortier was unable to parse a file)
  //  - "diagnostic" - All the above along with type information that sortier was unable to handle (great for opening bugs!)
  logLevel?: "diagnostic" | "normal" | "quiet";

  // Options for the javascript type languages
  js?: JavascriptReprinterOptions;

  // Options for the javascript type languages
  css?: CssReprinterOptions;
}
