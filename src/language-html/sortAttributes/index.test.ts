import { expect } from "chai";
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename, join } from "path";

// Parsers
import { parse } from "angular-html-parser";

// The methods being tested here
import { sortAttributes } from "./index";

// Utilities
import { StringUtils } from "../../utilities/string-utils";

interface TestInfo {
  inputFilePath: string;
  outputFilePath: string;
  testName: string;
}

describe("language-html/sortAttributes", () => {
  let testInfos: TestInfo[];

  let assetsFolderPath = join(__dirname, "test_assets/*.input.html.txt");
  testInfos = sync(assetsFolderPath).map(filePath => {
    let segments = basename(filePath).split(".");

    let cleanedTestName = StringUtils.sentenceCase(
      segments[0].replace(/_/g, " ")
    );

    return {
      inputFilePath: filePath,
      outputFilePath: filePath.replace(".input.html.txt", ".output.html.txt"),
      testName: cleanedTestName
    };
  });

  testInfos.forEach(testInfo => {
    it(testInfo.testName, () => {
      let input = readFileSync(testInfo.inputFilePath, "utf8");
      let expected = readFileSync(testInfo.outputFilePath, "utf8");
      let node = parse(input);
      let actual = sortAttributes(node.rootNodes[0], input);

      expect(actual).to.equal(expected);
    });
  });
});
