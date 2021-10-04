import { runTestAssestsTests } from "../../utilities/test-utils.js";
import { getParser } from "../utilities/test-utils.js";

// The methods being tested here
import { sortObjectTypeAnnotation } from "./index.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

runTestAssestsTests(
  __dirname,
  (inputFilePath: string, inputFileContents: string) => {
    const parser = getParser(inputFilePath);
    const parsed = parser(inputFileContents);

    const actual = sortObjectTypeAnnotation(
      parsed.body[0].declaration.right,
      parsed.comments,
      inputFileContents,
      {}
    );
    return actual;
  }
);
