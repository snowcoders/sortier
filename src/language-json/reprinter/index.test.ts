// The methods being tested here
import { Reprinter } from "./index.js";

// Utilities
import { runTestAssetsTests } from "../../utilities/test-utils.js";

describe("language-json/reprinter", () => {
  runTestAssetsTests(import.meta.url, (inputFilePath: string, inputFileContents: string) => {
    return new Reprinter().getRewrittenContents(inputFilePath, inputFileContents, {});
  });

  it("Supports json files", () => {
    expect(new Reprinter().isFileSupported("test.json")).toEqual(true);
  });

  it("Does not support typescript files", () => {
    expect(new Reprinter().isFileSupported("test.ts")).toEqual(false);
  });

  it("Throws an error if the file cannot be parsed", () => {
    expect(() => {
      new Reprinter().getRewrittenContents("parse_fail.json", "This shouldn't parse", {});
    }).toThrow();
  });
});
