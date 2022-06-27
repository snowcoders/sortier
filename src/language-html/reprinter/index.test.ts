import { validateOptions } from "../../config/validate-options.js";
import { runTestAssetsTests } from "../../utilities/test-utils.js";

// The methods being tested here
import { Reprinter } from "./index.js";

describe("language-html/reprinter", () => {
  runTestAssetsTests(
    import.meta.url,
    (inputFilePath: string, inputFileContents: string) => {
      return new Reprinter().getRewrittenContents(
        inputFilePath,
        inputFileContents,
        validateOptions({})
      );
    }
  );

  it("Throws an error if the file cannot be parsed", () => {
    expect(() => {
      new Reprinter().getRewrittenContents(
        "parse_fail.html",
        "<html>This has the wrong closing tag</html2>",
        validateOptions({})
      );
    }).toThrow();
  });
});
