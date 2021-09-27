// Parsers
import { parse } from "angular-html-parser";

// The methods being tested here
import { sortAttributes } from "./index.js";

// Utilities
import { runTestAssestsTests } from "../../utilities/test-utils.js";

describe("language-html/sortAttributes", () => {
  runTestAssestsTests(
    __dirname,
    (inputFilePath: string, inputFileContents: string) => {
      const node = parse(inputFileContents);
      const actual = sortAttributes(node.rootNodes[0], inputFileContents);
      return actual;
    }
  );
});
