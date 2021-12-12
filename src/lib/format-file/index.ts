import { findUpSync } from "find-up";
import path from "path";
import { resolveOptions, SortierOptions } from "../../config/index.js";
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
