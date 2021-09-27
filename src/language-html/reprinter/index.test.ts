import { runTestAssestsTests } from "../../utilities/test-utils.js";

// The methods being tested here
import { Reprinter } from "./index.js";

describe("language-html/reprinter", () => {
  runTestAssestsTests(
    __dirname,
    (inputFilePath: string, inputFileContents: string) => {
      return new Reprinter().getRewrittenContents(
        inputFilePath,
        inputFileContents,
        {}
      );
    }
  );

  it("Throws an error if the file cannot be parsed", () => {
    expect(() => {
      new Reprinter().getRewrittenContents(
        "parse_fail.html",
        "<html>This has the wrong closing tag</html2>",
        {}
      );
    }).toThrow();
  });
});
