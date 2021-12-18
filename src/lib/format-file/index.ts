import { findUpSync } from "find-up";
import path from "path";
import { resolveOptions, SortierOptions } from "../../config/index.js";
import { UnsupportedExtensionError } from "../../error/unsupported-extension-error.js";
import { getReprinterForFile } from "../../language.js";
import { FileUtils } from "../../utilities/file-utils.js";
import { LoggerVerboseOption, LogUtils } from "../../utilities/log-utils.js";
import { isIgnored } from "../is-ignored/index.js";

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
      if (isIgnored(ignoreText, relativeFilePath)) {
        return;
      }
    } catch (readError) {
      LogUtils.log(
        LoggerVerboseOption.Diagnostic,
        `Error reading file ${filename}`,
        readError
      );
      throw readError;
    }
  }

  const language = getReprinterForFile(filename);
  if (language == null) {
    throw new UnsupportedExtensionError(
      `File ${filename} has an file extension which is not supported`
    );
  }

  const originalFileContents = FileUtils.readFileContents(filename);
  const newFileContents = language.getRewrittenContents(
    filename,
    originalFileContents,
    options
  );

  if (options.isTestRun == null || !options.isTestRun) {
    try {
      FileUtils.writeFileContents(filename, newFileContents);
    } catch (writeError) {
      LogUtils.log(
        LoggerVerboseOption.Diagnostic,
        `Error writing file ${filename}`,
        writeError
      );
      throw writeError;
    }
  }
}
