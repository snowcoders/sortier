// The methods being tested here
import { Reprinter } from "./index.js";

// Utilities
import { join } from "path";
import { FileUtils } from "../utilities/file-utils.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import test from "ava";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("Does not rewrite sortier ignored files", (t) => {
  const inputFilePath = join(__dirname, "test_assets/sortierignore.input.ts");
  const input = FileUtils.readFileContents(inputFilePath);
  const output = FileUtils.readFileContents(
    join(__dirname, "test_assets/sortierignore.output.ts.txt")
  );
  // If this expect is hit, then the test files were tampered with before we got here
  t.is(input, output);

  Reprinter.rewriteFile(inputFilePath, {});
  const newInput = FileUtils.readFileContents(inputFilePath);
  t.is(newInput, output);
});

test("Does not throw error for unsupported files", (t) => {
  const inputFilePath = join(__dirname, "../../readme.md");
  t.notThrows(() => {
    Reprinter.rewriteFile(inputFilePath, {});
  });
});
