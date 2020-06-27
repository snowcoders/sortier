import { ILanguage } from "../../language";
import { JavascriptReprinter } from "../../language-js";
import { ReprinterOptions } from "../../reprinter-options";
import { StringUtils } from "../../utilities/string-utils";

export class Reprinter implements ILanguage {
  public static readonly EXTENSIONS = [".json", ".json.txt"];

  public getRewrittenContents(
    filename: string,
    fileContents: string,
    // Left in for consistency with other sort functions
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: ReprinterOptions
  ) {
    const prefix = "export default (";
    const suffix = ");";
    const temporaryFileContents = prefix + fileContents + suffix;
    const rewritten = new JavascriptReprinter().getRewrittenContents(
      filename,
      temporaryFileContents,
      {
        js: {
          parser: "typescript",
        },
      }
    );
    return rewritten.substring(prefix.length, rewritten.length - suffix.length);
  }

  public isFileSupported(filename: string) {
    return StringUtils.stringEndsWithAny(filename, Reprinter.EXTENSIONS);
  }
}
