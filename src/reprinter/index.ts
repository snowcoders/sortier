import { ILanguage } from "../language";
import { HtmlReprinter } from "../language-html";
import { JavascriptReprinter } from "../language-js";
import { JsonReprinter } from "../language-json";
import { ReprinterOptions } from "../reprinter-options";
import { FileUtils } from "../utilities/file-utils";

export class Reprinter {
  private static reprinters: ILanguage[] = [
    new HtmlReprinter(),
    new JavascriptReprinter(),
    new JsonReprinter()
  ];
  public static rewrite(filename: string, options: ReprinterOptions) {
    let language: null | ILanguage = null;
    for (let reprinter of Reprinter.reprinters) {
      if (!reprinter.isFileSupported(filename)) {
        continue;
      }

      language = reprinter;
    }

    if (language == null) {
      throw new Error("Could not find language support for file - " + filename);
    }

    let originalFileContents = FileUtils.readFileContents(filename);
    let newFileContents = language.getRewrittenContents(
      filename,
      originalFileContents,
      options
    );

    if (options.isTestRun == null || !options.isTestRun) {
      FileUtils.writeFileContents(filename, newFileContents);
    }
  }
}
