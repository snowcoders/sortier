// The methods being tested here
import { sortSwitchCases } from "./index.js";

// Utilities
import { runTestAssestsTests } from "../../utilities/test-utils.js";
import { getParser } from "../utilities/test-utils.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

runTestAssestsTests(
  __dirname,
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
