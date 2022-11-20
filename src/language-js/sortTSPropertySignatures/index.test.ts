import { describe } from "@jest/globals";

// The methods being tested here
import { sortTSPropertySignatures } from "./index.js";

// Utilities
import { runTestAssetsTests } from "../../utilities/test-utils.js";
import { getParser } from "../utilities/test-utils.js";

describe("language-js/sortTSPropertySignatures", () => {
  runTestAssetsTests(import.meta.url, (inputFilePath: string, inputFileContents: string) => {
    const parser = getParser(inputFilePath);
    const parsed = parser(inputFileContents);
    const actual = sortTSPropertySignatures(
      parsed.body[0].declaration.body.body,
      parsed.comments,
      inputFileContents,
      {}
    );

    return actual;
  });
});
