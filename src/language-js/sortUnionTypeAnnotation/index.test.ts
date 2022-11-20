import { describe } from "@jest/globals";

// The methods being tested here
import { sortUnionTypeAnnotation } from "./index.js";

// Utilities
import { runTestAssetsTests } from "../../utilities/test-utils.js";
import { getParser } from "../utilities/test-utils.js";

describe("language-js/sortUnionTypeAnnotation", () => {
  runTestAssetsTests(import.meta.url, (inputFilePath: string, inputFileContents: string) => {
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
      return sortUnionTypeAnnotation(parsed.body[0].body.properties[0].value, parsed.comments, inputFileContents, {});
    }
  });
});
