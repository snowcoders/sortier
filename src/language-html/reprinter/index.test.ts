import { expect } from "chai";
import { sync } from "globby";
import { basename } from "path";

// The methods being tested here
import { Reprinter } from "./index";

// Utilities
import { FileUtils } from "../../utilities/file-utils";
import { StringUtils } from "../../utilities/string-utils";

interface TestInfo {
  inputFilePath: string;
  outputFilePath: string;
  testName: string;
}

describe("language-html/reprinter", () => {
  let testInfos: TestInfo[];

  let assetsFolderPath = FileUtils.globbyJoin(
    __dirname,
    "test_assets/*.input.html.txt"
  );
  testInfos = sync(assetsFolderPath).map(filePath => {
    let segments = basename(filePath).split(".");

    let cleanedTestName = StringUtils.sentenceCase(
      segments[0].replace(/_/g, " ")
    );

    return {
      inputFilePath: filePath,
      outputFilePath: filePath.replace(".input.html.txt", ".output.html.txt"),
      parserType: segments[0],
      testName: cleanedTestName
    };
  });

  testInfos.forEach(testInfo => {
    it(testInfo.testName, () => {
      let input = FileUtils.readFileContents(testInfo.inputFilePath);
      let expected = FileUtils.readFileContents(testInfo.outputFilePath);
      let actual = new Reprinter().getRewrittenContents(
        testInfo.inputFilePath,
        input,
        {}
      );

      expect(actual).to.equal(expected);
    });
  });
});
