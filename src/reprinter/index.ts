import findup from "find-up";
import ignore from "ignore";
import path from "path";
import { ILanguage } from "../language.js";
import { CssReprinter } from "../language-css/index.js";
import { HtmlReprinter } from "../language-html/index.js";
import { JavascriptReprinter } from "../language-js/index.js";
import { JsonReprinter } from "../language-json/index.js";
import { ReprinterOptions } from "../reprinter-options.js";
import { FileUtils } from "../utilities/file-utils.js";
import { LogUtils, LoggerVerboseOption } from "../utilities/log-utils.js";

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
        const ignoreText = FileUtils.readFileContents(ignoreFilePath).trim();
        const relativeFilePath = path.relative(path.resolve("."), filename);
        if (0 < ignoreText.length) {
          const ig = ignore();
          ig.add(ignoreText.split(/\r?\n/));
          if (ig.ignores(relativeFilePath)) {
            return;
          }
        }
      } catch (readError) {
        LogUtils.log(
          LoggerVerboseOption.Normal,
          `Error reading file ${filename}`,
          readError
        );
      }
    }

    const language = this.getReprinterForFile(filename);
    if (language == null) {
      return;
    }

    const originalFileContents = FileUtils.readFileContents(filename);
    const newFileContents = language.getRewrittenContents(
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
    const fakeFileName = `example.${fileExtension}`;
    const language = this.getReprinterForFile(fakeFileName);
    if (language == null) {
      return;
    }

    const newFileContents = language.getRewrittenContents(
      fakeFileName,
      text,
      options
    );

    return newFileContents;
  }

  private static getReprinterForFile(filename: string) {
    for (const reprinter of Reprinter.reprinters) {
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
