import { findUpSync } from "find-up";
import path from "path";
import { SortierOptions, resolveOptions } from "../../config/index.js";
import { IgnoredFileError } from "../../error/ignored-file-error.js";
import { UnsupportedExtensionError } from "../../error/unsupported-extension-error.js";
import { getReprinterForFile } from "../../language.js";
import { FileUtils } from "../../utilities/file-utils.js";
import { LogUtils, LoggerVerboseOption } from "../../utilities/log-utils.js";
import { isIgnored } from "../is-ignored/index.js";

export function formatFile(filename: string, options: SortierOptions = resolveOptions(filename)) {
  const language = getReprinterForFile(filename);
  if (language == null) {
    throw new UnsupportedExtensionError(filename);
  }

  const isFileIgnored = isIgnoredFile(filename);
  if (isFileIgnored) {
    throw new IgnoredFileError(filename);
  }

  const originalFileContents = FileUtils.readFileContents(filename);
  const newFileContents = language.getRewrittenContents(filename, originalFileContents, options);

  if (options.isTestRun == null || !options.isTestRun) {
    try {
      FileUtils.writeFileContents(filename, newFileContents);
    } catch (writeError) {
      LogUtils.log(LoggerVerboseOption.Diagnostic, `Error writing file ${filename}`, writeError);
      throw writeError;
    }
  }
}

function isIgnoredFile(filename: string) {
  // Find the nearest sortier ignore file
  const ignoreFilePath = findUpSync(".sortierignore", {
    cwd: filename,
  });
  if (ignoreFilePath != null) {
    try {
      const ignoreText = FileUtils.readFileContents(ignoreFilePath).trim();
      const relativeFilePath = path.relative(path.resolve("."), filename);
      const result = isIgnored(ignoreText, relativeFilePath);
      return result;
    } catch (readError) {
      LogUtils.log(LoggerVerboseOption.Diagnostic, `Error reading file ${filename}`, readError);
      throw readError;
    }
  }

  return false;
}
