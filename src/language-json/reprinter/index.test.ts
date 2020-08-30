import { expect } from "chai";

// The methods being tested here
import { Reprinter } from "./index";

// Utilities
import { runTestAssestsTests } from "../../utilities/test-utils";

describe("language-json/reprinter", () => {
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

  it("Supports json files", () => {
    expect(new Reprinter().isFileSupported("test.json")).to.equal(true);
  });

  it("Does not support typescript files", () => {
    expect(new Reprinter().isFileSupported("test.ts")).to.equal(false);
  });

  it("Throws an error if the file cannot be parsed", () => {
    expect(() => {
      new Reprinter().getRewrittenContents(
        "parse_fail.json",
        "This shouldn't parse",
        {}
      );
    }).to.throw();
  });
});
