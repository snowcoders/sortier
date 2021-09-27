import { ReprinterOptions } from "./reprinter-options.js";

export interface ILanguage {
  getRewrittenContents(
    filename: string,
    fileContents: string,
    options: ReprinterOptions
  ): string;
  isFileSupported(filename: string): boolean;
}
