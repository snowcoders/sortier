import { SortierOptions } from "./config/index.js";
import { CssReprinter } from "./language-css/index.js";
import { HtmlReprinter } from "./language-html/index.js";
import { JavascriptReprinter } from "./language-js/index.js";
import { JsonReprinter } from "./language-json/index.js";

export interface ILanguage {
  getRewrittenContents(filename: string, fileContents: string, options: SortierOptions): string;
  isFileSupported(filename: string): boolean;
}

const reprinters: ILanguage[] = [
  new CssReprinter(),
  new HtmlReprinter(),
  new JavascriptReprinter(),
  new JsonReprinter(),
];

export function getReprinterForFile(filename: string) {
  for (const reprinter of reprinters) {
    if (reprinter.isFileSupported(filename)) {
      return reprinter;
    }
  }

  return null;
}
