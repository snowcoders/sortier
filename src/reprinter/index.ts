import * as fs from "fs";

// Reprinters
import { ILanguage } from "../language";
import { JavascriptReprinter } from "../language-js";
import { ReprinterOptions } from "../reprinter-options";

export class Reprinter {
  private static reprinters: ILanguage[] = [new JavascriptReprinter()];
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

    let originalFileContents = this.readFileContents(filename);
    let newFileContents = language.getRewrittenContents(
      filename,
      originalFileContents,
      options
    );

    if (options.isTestRun == null || !options.isTestRun) {
      this.writeFileContents(filename, newFileContents);
    }
  }

  private static readFileContents(filename: string) {
    try {
      return fs.readFileSync(filename, "utf8");
    } catch (error) {
      throw new Error(`Could not read file: ${filename}\n${error.message}`);
    }
  }

  private static writeFileContents(filename: string, fileContents: string) {
    try {
      fs.writeFileSync(filename, fileContents, "utf8");
    } catch (error) {
      throw new Error(`Could not write file: ${filename}\n${error.message}`);
    }
  }
}
