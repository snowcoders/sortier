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
    let prefix = "return ";
    let temporaryFileContents = prefix + fileContents;
    let rewritten = new JavascriptReprinter().getRewrittenContents(
      filename,
      temporaryFileContents,
      {
        isHelpMode: options.isHelpMode,
        parser: "typescript"
      }
    );
    return rewritten.substring(prefix.length);
  }

  public isFileSupported(filename: string) {
    return StringUtils.stringEndsWithAny(filename, Reprinter.EXTENSIONS);
  }
}
