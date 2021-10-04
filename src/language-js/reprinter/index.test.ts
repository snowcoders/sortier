// The methods being tested here
import { runTestAssestsTests } from "../../utilities/test-utils.js";
import { Reprinter } from "./index.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import test from "ava";

const __dirname = dirname(fileURLToPath(import.meta.url));

runTestAssestsTests(
  __dirname,
  (inputFilePath: string, inputFileContents: string) => {
    const isFlow = inputFilePath.indexOf("/flow.") !== -1;
    return new Reprinter().getRewrittenContents(
      inputFilePath,
      inputFileContents,
      {
        js: {
          parser: isFlow ? "flow" : undefined,
        },
      }
    );
  }
);

test("Throws error if file is not supported", (t) => {
  t.throws(() => {
    new Reprinter().getRewrittenContents("./readme.md", "", {});
  });
});

test("Throws an error if the file cannot be parsed", (t) => {
  t.throws(() => {
    new Reprinter().getRewrittenContents(
      "parse_fail.js",
      "This shouldn't parse",
      {}
    );
  });
});
