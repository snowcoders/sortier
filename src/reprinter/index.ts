import { resolveOptions } from "../config/index.js";
import { findUpSync } from "find-up";
import ignore from "ignore";
import path from "path";
import { CssReprinter } from "../language-css/index.js";
import { HtmlReprinter } from "../language-html/index.js";
import { JavascriptReprinter } from "../language-js/index.js";
import { JsonReprinter } from "../language-json/index.js";
import { ILanguage } from "../language.js";
import { SortierOptions } from "../config/index.js";
import { FileUtils } from "../utilities/file-utils.js";
import { LogUtils, LoggerVerboseOption } from "../utilities/log-utils.js";

const reprinters: ILanguage[] = [
  new CssReprinter(),
  new HtmlReprinter(),
  new JavascriptReprinter(),
  new JsonReprinter(),
];

export function formatFile(
  filename: string,
  options: SortierOptions = resolveOptions(filename)
) {
  // Find the nearest sortier ignore file
  const ignoreFilePath = findUpSync(".sortierignore", {
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

  const language = getReprinterForFile(filename);
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

export function formatText(
  fileExtension: string,
  text: string,
  options: SortierOptions
) {
  const fakeFileName = `example.${fileExtension}`;
  const language = getReprinterForFile(fakeFileName);
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

function getReprinterForFile(filename: string) {
  for (const reprinter of reprinters) {
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
