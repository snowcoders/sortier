import { ReprinterOptions } from "./reprinter-options.js";
import { Reprinter } from "./reprinter/index.js";

export function formatFile(filePath: string, options: ReprinterOptions) {
  Reprinter.rewriteFile(filePath, options);
}

export function formatText(
  fileExtension: string,
  contents: string,
  options: ReprinterOptions
) {
  return Reprinter.rewriteText(fileExtension, contents, options);
}
