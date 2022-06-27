// The methods being tested here
import { validateOptions } from "../../config/validate-options.js";
import { runTestAssetsTests } from "../../utilities/test-utils.js";
import { Reprinter } from "./index.js";

describe("language-js/reprinter", () => {
  runTestAssetsTests(
    import.meta.url,
    (inputFilePath: string, inputFileContents: string) => {
      const isFlow = inputFilePath.indexOf("/flow.") !== -1;
      return new Reprinter().getRewrittenContents(
        inputFilePath,
        inputFileContents,
        validateOptions({
          js: {
            parser: isFlow ? "flow" : undefined,
          },
        })
      );
    }
  );

  it("Throws error if file is not supported", () => {
    expect(() => {
      new Reprinter().getRewrittenContents(
        "./readme.md",
        "",
        validateOptions({})
      );
    }).toThrow();
  });

  it("Throws an error if the file cannot be parsed", () => {
    expect(() => {
      new Reprinter().getRewrittenContents(
        "parse_fail.js",
        "This shouldn't parse",
        validateOptions({})
      );
    }).toThrow();
  });
});
