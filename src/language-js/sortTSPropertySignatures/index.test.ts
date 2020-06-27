// The methods being tested here
import { sortTSPropertySignatures } from "./index";

// Utilities
import { runTestAssestsTests } from "../../utilities/test-utils";
import { getParser } from "../utilities/test-utils";

describe("language-js/sortTSPropertySignatures", () => {
  runTestAssestsTests(
    __dirname,
    (inputFilePath: string, inputFileContents: string) => {
      const parser = getParser(inputFilePath);
      const parsed = parser(inputFileContents);
      const actual = sortTSPropertySignatures(
        parsed.body[0].declaration.body.body,
        parsed.comments,
        inputFileContents,
        {}
      );

      return actual;
    }
  );
});
