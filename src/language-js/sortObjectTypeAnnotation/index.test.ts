import { runTestAssestsTests } from "../../utilities/test-utils";
import { getParser } from "../utilities/test-utils";

// The methods being tested here
import { sortObjectTypeAnnotation } from "./index";

describe("language-js/sortObjectTypeAnnotation", () => {
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
});
