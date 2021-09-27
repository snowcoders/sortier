import { Reprinter } from "./reprinter/index.js";
import { ReprinterOptions } from "./reprinter-options.js";

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
