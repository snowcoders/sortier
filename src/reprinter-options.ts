// TODO export this via the index.js
import { SortClassContentsOptions } from "./language-js/sortClassContents";

export interface ReprinterOptions {
  // Default "false". If true, prints out very verbose lines that sortier doesn't know how to handle so you can open Github issues about them
  isHelpMode?: boolean;

  // Default "false". If true, sortier will run but not rewrite any files. Great for testing to make sure your code base doesn't have any weird issues before rewriting code.
  isTestRun?: boolean;

  // Default "normal". This overrides isHelpMode if set.
  //  - "quiet" - No console logs
  //  - "normal" - General information (e.g. if sortier was unable to parse a file)
  //  - "diagnostic" - All the above along with type information that sortier was unable to handle (great for opening bugs!)
  logLevel?: "diagnostic" | "normal" | "quiet";

  // Default undefined. The parser to use. If undefined, sortier will determine the parser to use based on the file extension
  parser?: "flow" | "typescript";

  // Default "source". The order you wish to sort import statements. Source is the path the import comes from. First specifier is the first item imported.
  sortImportDeclarations?: "first-specifier" | "source";

  // Default ["undefined", "null", "*", "object", "function"]. The order to sort object types when encountered.
  sortTypeAnnotations?: ("null" | "undefined" | "*" | "function" | "object")[];

  // Default undefined. If defined, class contents will be sorted based on the options provided. Turned off by default because it will sort over blank lines.
  sortClassContents?: SortClassContentsOptions;
}
