import { describe, it, expect } from "@jest/globals";

// The methods being tested here
import { formatFile } from "./index.js";

// Utilities
import { join } from "path";
import { FileUtils } from "../../utilities/file-utils.js";
import { getFolderPathFromFileUrl } from "../../utilities/test-utils.js";

const currentFolderPath = getFolderPathFromFileUrl(import.meta.url);

describe("reprinter", () => {
  it("Does not rewrite sortier ignored files", () => {
    const inputFilePath = join(currentFolderPath, "test_assets/sortierignore.input.ts");
    const input = FileUtils.readFileContents(inputFilePath);
    const output = FileUtils.readFileContents(join(currentFolderPath, "test_assets/sortierignore.output.ts.txt"));
    // If this expect is hit, then the test files were tampered with before we got here
    expect(input).toEqual(output);

    formatFile(inputFilePath, {});
    const newInput = FileUtils.readFileContents(inputFilePath);
    expect(newInput).toEqual(output);
  });

  it("Does throw error for unsupported files", () => {
    const inputFilePath = join(currentFolderPath, "../../readme.md");
    expect(() => {
      formatFile(inputFilePath, {});
    }).toThrow();
  });
});
