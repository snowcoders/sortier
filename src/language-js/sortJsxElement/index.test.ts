// The methods being tested here
import { sortJsxElement } from "./index.js";

// Utilities
import { runTestAssestsTests } from "../../utilities/test-utils.js";
import { getParser } from "../utilities/test-utils.js";

describe("language-js/sortJsxElement", () => {
  runTestAssestsTests(
    __dirname,
    (inputFilePath: string, inputFileContents: string) => {
      const parser = getParser(inputFilePath);
      const parsed = parser(inputFileContents);

      const actual = sortJsxElement(
        parsed.body[0].argument,
        parsed.comments,
        inputFileContents
      );
      return actual;
    }
  );
});
