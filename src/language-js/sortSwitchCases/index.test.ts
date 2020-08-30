// The methods being tested here
import { sortSwitchCases } from "./index";

// Utilities
import { runTestAssestsTests } from "../../utilities/test-utils";
import { getParser } from "../utilities/test-utils";

describe("language-js/sortSwitchCases", () => {
  runTestAssestsTests(
    __dirname,
    (inputFilePath: string, inputFileContents: string) => {
      const parser = getParser(inputFilePath);
      let parsed = parser(inputFileContents);

      let actual = sortSwitchCases(
        parsed.body[0].cases || parsed.body[0].body.body[0].cases,
        parsed.comments,
        inputFileContents,
        {}
      );
      return actual;
    }
  );
});
