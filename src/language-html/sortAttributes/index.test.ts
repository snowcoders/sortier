import { describe } from "@jest/globals";

// Parsers
import { parse } from "angular-html-parser/lib/angular-html-parser/src/index.js";

// The methods being tested here
import { sortAttributes } from "./index.js";

// Utilities
import { runTestAssetsTests } from "../../utilities/test-utils.js";

describe("language-html/sortAttributes", () => {
  runTestAssetsTests(import.meta.url, (inputFilePath: string, inputFileContents: string) => {
    const node = parse(inputFileContents);
    const actual = sortAttributes(node.rootNodes[0], inputFileContents);
    return actual;
  });
});
