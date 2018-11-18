import { expect } from "chai";
import { sync } from "globby";
import { basename, join } from "path";
import { FileUtils } from "../../utilities/file-utils";
import { StringUtils } from "../../utilities/string-utils";

// The methods being tested here
import { Reprinter } from "./index";

interface TestInfo {
  inputFilePath: string;
  outputFilePath: string;
  parserType: string;
  testName: string;
}

describe("language-js/reprinter", () => {
  let testInfos: TestInfo[];
  let parserTypes: Set<string> = new Set<string>();

  let assetsFolderPath = join(__dirname, "test_assets/*.input.(js|ts).txt");
  testInfos = sync(assetsFolderPath).map(filePath => {
    let segments = basename(filePath).split(".");

    let parserType = StringUtils.sentenceCase(segments[0]);
    parserTypes.add(parserType);
    let cleanedTestName = segments[1].replace(/_/g, " ").toLowerCase();
    cleanedTestName = StringUtils.sentenceCase(cleanedTestName);

    return {
      inputFilePath: filePath,
      outputFilePath: filePath.replace(".input.", ".output."),
      parserType: parserType,
      testName: cleanedTestName
    };
  });

  it("Setup succeeds", () => {
    expect(testInfos.length).to.not.equal(
      0,
      "Expected to find at least one test"
    );
  });

  parserTypes.forEach(parserType => {
    describe(parserType, () => {
      testInfos.forEach(testInfo => {
        if (testInfo.parserType === parserType) {
          // Useful if you need to test a single file
          // if (testInfo.testName.includes("Inline property"))
          it(testInfo.testName, () => {
            let expected = FileUtils.readFileContents(testInfo.outputFilePath);
            let actual = new Reprinter().getRewrittenContents(
              testInfo.inputFilePath,
              FileUtils.readFileContents(testInfo.inputFilePath),
              {}
            );

            expect(actual).to.equal(expected);
          });
        }
      });
    });
  });
});
