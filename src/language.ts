import { SortierOptions } from "./config/index.js";

export interface ILanguage {
  getRewrittenContents(
    filename: string,
    fileContents: string,
    options: SortierOptions
  ): string;
  isFileSupported(filename: string): boolean;
}
