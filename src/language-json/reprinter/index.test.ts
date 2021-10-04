// The methods being tested here
import { Reprinter } from "./index.js";
import test from "ava";

// Utilities
import { runTestAssestsTests } from "../../utilities/test-utils.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

test("Supports json files", (t) => {
  t.is(new Reprinter().isFileSupported("test.json"), true);
});

test("Does not support typescript files", (t) => {
  t.is(new Reprinter().isFileSupported("test.ts"), false);
});

test("Throws an error if the file cannot be parsed", (t) => {
  t.throws(() => {
    new Reprinter().getRewrittenContents(
      "parse_fail.json",
      "This shouldn't parse",
      {}
    );
  });
});
