import findup from "find-up";
import ignore from "ignore";
import path from "path";
import { ILanguage } from "../language";
import { CssReprinter } from "../language-css";
import { HtmlReprinter } from "../language-html";
import { JavascriptReprinter } from "../language-js";
import { JsonReprinter } from "../language-json";
import { ReprinterOptions } from "../reprinter-options";
import { FileUtils } from "../utilities/file-utils";
import { LogUtils, LoggerVerboseOption } from "../utilities/log-utils";

export class Reprinter {
  private static reprinters: ILanguage[] = [
    new CssReprinter(),
    new HtmlReprinter(),
    new JavascriptReprinter(),
    new JsonReprinter(),
  ];
  public static rewriteFile(filename: string, options: ReprinterOptions) {
    // Find the nearest sortier ignore file
    const ignoreFilePath = findup.sync(".sortierignore", {
      cwd: filename,
    });
    if (ignoreFilePath != null) {
      try {
        let ignoreText = FileUtils.readFileContents(ignoreFilePath).trim();
        const relativeFilePath = path.relative(path.resolve("."), filename);
        if (0 < ignoreText.length) {
          let ig = ignore();
          ig.add(ignoreText.split(/\r?\n/));
          if (ig.ignores(relativeFilePath)) {
            return;
          }
        }
      } catch (readError) {}
    }

    let language = this.getReprinterForFile(filename);
    if (language == null) {
      return;
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

  public static rewriteText(
    fileExtension: string,
    text: string,
    options: ReprinterOptions
  ) {
    let fakeFileName = `example.${fileExtension}`;
    let language = this.getReprinterForFile(fakeFileName);
    if (language == null) {
      return;
    }

    let newFileContents = language.getRewrittenContents(
      fakeFileName,
      text,
      options
    );

    return newFileContents;
  }

  private static getReprinterForFile(filename: string) {
    for (let reprinter of Reprinter.reprinters) {
      if (reprinter.isFileSupported(filename)) {
        return reprinter;
      }
    }

    LogUtils.log(
      LoggerVerboseOption.Diagnostic,
      "Could not find language support for file - " + filename
    );
    return null;
  }
}
