import { SortierOptions } from "../../config/index.js";
import { getReprinterForFile } from "../../language.js";

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
