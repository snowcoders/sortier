import { ILanguage } from "../../language";
import { JavascriptReprinter } from "../../language-js";
import { ReprinterOptions } from "../../reprinter-options";
import { StringUtils } from "../../utilities/string-utils";

export class Reprinter implements ILanguage {
  public static readonly EXTENSIONS = [".json", ".json.txt"];

  public getRewrittenContents(
    filename: string,
    fileContents: string,
    options: ReprinterOptions
  ) {
    let prefix = "export default (";
    let suffix = ");";
    let temporaryFileContents = prefix + fileContents + suffix;
    let rewritten = new JavascriptReprinter().getRewrittenContents(
      filename,
      temporaryFileContents,
      {
        js: {
          parser: "typescript"
        }
      }
    );
    return rewritten.substring(prefix.length, rewritten.length - suffix.length);
  }

  public isFileSupported(filename: string) {
    return StringUtils.stringEndsWithAny(filename, Reprinter.EXTENSIONS);
  }
}
