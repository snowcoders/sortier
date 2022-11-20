import { SortierOptions } from "../../config/index.js";
import { UnsupportedExtensionError } from "../../error/unsupported-extension-error.js";
import { getReprinterForFile } from "../../language.js";

export function formatText(fileExtension: string, text: string, options: SortierOptions) {
  const fakeFileName = `example.${fileExtension}`;
  const language = getReprinterForFile(fakeFileName);
  if (language == null) {
    throw new UnsupportedExtensionError(`File extension ${fileExtension} is not supported`);
  }

  const newFileContents = language.getRewrittenContents(fakeFileName, text, options);

  return newFileContents;
}
