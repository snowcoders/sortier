import { expect } from "chai";

// The methods being tested here
import { runTestAssestsTests } from "../../utilities/test-utils";
import { Reprinter } from "./index";

describe("language-js/reprinter", () => {
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

  it("Throws error if file is not supported", () => {
    expect(() => {
      new Reprinter().getRewrittenContents("./readme.md", "", {});
    }).to.throw();
  });

  it("Throws an error if the file cannot be parsed", () => {
    expect(() => {
      new Reprinter().getRewrittenContents(
        "parse_fail.js",
        "This shouldn't parse",
        {}
      );
    }).to.throw();
  });
});
