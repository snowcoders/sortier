// The methods being tested here
import { Reprinter } from "./index.js";

// Utilities
import { join } from "path";
import { FileUtils } from "../utilities/file-utils.js";

describe("reprinter", () => {
  it("Does not rewrite sortier ignored files", () => {
    const inputFilePath = join(__dirname, "test_assets/sortierignore.input.ts");
    const input = FileUtils.readFileContents(inputFilePath);
    const output = FileUtils.readFileContents(
      join(__dirname, "test_assets/sortierignore.output.ts.txt")
    );
    // If this expect is hit, then the test files were tampered with before we got here
    expect(input).toEqual(output);

    Reprinter.rewriteFile(inputFilePath, {});
    const newInput = FileUtils.readFileContents(inputFilePath);
    expect(newInput).toEqual(output);
  });

  it("Does not throw error for unsupported files", () => {
    const inputFilePath = join(__dirname, "../../readme.md");
    expect(() => {
      Reprinter.rewriteFile(inputFilePath, {});
    }).not.toThrow();
  });
});
