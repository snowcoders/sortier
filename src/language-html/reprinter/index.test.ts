import { runTestAssestsTests } from "../../utilities/test-utils.js";
import test from "ava";

// The methods being tested here
import { Reprinter } from "./index.js";
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

test("Throws an error if the file cannot be parsed", (t) => {
  t.throws(() => {
    new Reprinter().getRewrittenContents(
      "parse_fail.html",
      "<html>This has the wrong closing tag</html2>",
      {}
    );
  });
});
