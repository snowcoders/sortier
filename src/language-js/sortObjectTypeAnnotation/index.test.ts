import { describe } from "@jest/globals";

import { runTestAssetsTests } from "../../utilities/test-utils.js";
import { getParser } from "../utilities/test-utils.js";

// The methods being tested here
import { sortObjectTypeAnnotation } from "./index.js";

describe("language-js/sortObjectTypeAnnotation", () => {
  runTestAssetsTests(import.meta.url, (inputFilePath: string, inputFileContents: string) => {
    const parser = getParser(inputFilePath);
    const parsed = parser(inputFileContents);

    const actual = sortObjectTypeAnnotation(parsed.body[0].declaration.right, parsed.comments, inputFileContents, {});
    return actual;
  });
});
