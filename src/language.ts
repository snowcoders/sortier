import { ReprinterOptions } from "./reprinter-options";

export interface ILanguage {
  getRewrittenContents(
    filename: string,
    fileContents: string,
    options: ReprinterOptions
  ): string;
  isFileSupported(filename: string): boolean;
}
