import { Reprinter } from "./reprinter";
import { ReprinterOptions } from "./reprinter-options";

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
