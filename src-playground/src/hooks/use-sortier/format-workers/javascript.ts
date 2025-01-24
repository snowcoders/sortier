// @ts-ignore - The following is needed to mock process for typescript
if (self.process == null) {
  // @ts-ignore
  self.process = {
    env: {},
    cwd: () => ".",
  };
}

import { JavascriptReprinter } from "../../../../../src/language-js/index";
import { getErrorString } from "../../../utilities/get-error-string";
import { SortierWorkerInputData, SortierWorkerOutputData } from "../types";

onmessage = function (e: MessageEvent<SortierWorkerInputData>) {
  const { data } = e;
  if (data == null) {
    return;
  }

  const { options, text, type } = data;

  const reprinter = new JavascriptReprinter();
  try {
    const result = reprinter.getRewrittenContents(`test.${type}`, text, options);

    const output: SortierWorkerOutputData = { text: result };
    postMessage(output);
  } catch (e) {
    const errorMessage = getErrorString(e);
    const output: SortierWorkerOutputData = { text: errorMessage };
    postMessage(output);
  }
};
