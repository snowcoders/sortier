// The methods being tested here
import { sortSwitchCases } from "./index.js";

// Utilities
import { runTestAssetsTests } from "../../utilities/test-utils.js";
import { getParser } from "../utilities/test-utils.js";

describe("language-js/sortSwitchCases", () => {
  runTestAssetsTests(
    import.meta.url,
    (inputFilePath: string, inputFileContents: string) => {
      const parser = getParser(inputFilePath);
      const parsed = parser(inputFileContents);

      const actual = sortSwitchCases(
        parsed.body[0].cases || parsed.body[0].body.body[0].cases,
        parsed.comments,
        inputFileContents,
        {}
      );
      return actual;
    }
  );
});
