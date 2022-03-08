import {
  CssReprinter,
  CssSortierOptions,
} from "../../../../src/language-css/index";
import { getErrorString } from "../utilities/get-error-string";

export type SortierWorkerData = { text: string; options: CssSortierOptions };

onmessage = function (e) {
  const { data } = e;
  if (data == null) {
    return;
  }

  const { text, options } = data;

  const reprinter = new CssReprinter();
  try {
    const result = reprinter.getRewrittenContents(
      "test.css",
      text,
      options || {}
    );

    postMessage({ text: result });
  } catch (e) {
    const errorMessage = getErrorString(e);
    postMessage({ text: errorMessage });
  }
};
