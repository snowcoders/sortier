// The methods being tested here
import { sortTSPropertySignatures } from "./index.js";

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
    const actual = sortTSPropertySignatures(
      parsed.body[0].declaration.body.body,
      parsed.comments,
      inputFileContents,
      {}
    );

    return actual;
  }
);
