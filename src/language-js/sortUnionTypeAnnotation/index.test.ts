// The methods being tested here
import { sortUnionTypeAnnotation } from "./index.js";

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

    if (inputFilePath.indexOf("typescript") !== -1) {
      return sortUnionTypeAnnotation(
        parsed.body[0].body.body[0].typeAnnotation.typeAnnotation,
        parsed.comments,
        inputFileContents,
        {}
      );
    } else {
      return sortUnionTypeAnnotation(
        parsed.body[0].body.properties[0].value,
        parsed.comments,
        inputFileContents,
        {}
      );
    }
  }
);
