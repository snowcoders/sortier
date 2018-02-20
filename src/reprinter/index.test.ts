import { expect } from 'chai';
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename, join, relative } from "path";

// Parsers
import { parse as flowParse } from '../parsers/flow';
import { parse as javascriptParse } from '../parsers/javascript';
import { parse as typescriptParse } from '../parsers/typescript';

// The methods being tested here
import { Reprinter } from './index';

interface TestInfo {
  testName: string;
  inputFilePath: string;
  outputFilePath: string;
}

describe('reprinter', () => {
  let testInfos: TestInfo[]

  let assetsFolderPath = join(__dirname, "test_assets/*.input.(js|ts).test");
  testInfos = sync(assetsFolderPath).map(filePath => {
    let segments = basename(filePath).split(".");

    let cleanedTestName = segments[0].replace(/_/g, " ").toLowerCase();
    cleanedTestName = cleanedTestName.charAt(0).toUpperCase() + cleanedTestName.slice(1);

    return {
      testName: cleanedTestName,
      inputFilePath: filePath,
      outputFilePath: filePath.replace(".input.", ".output.")
    };
  });

  it("Setup succeeds", () => {
    expect(testInfos.length).to.not.equal(0, "Expected to find at least one test");
  });

  testInfos.forEach(testInfo => {
    it(testInfo.testName, () => {
      let input = readFileSync(testInfo.inputFilePath, "utf8");
      let expected = readFileSync(testInfo.outputFilePath, "utf8");
      let actual = new Reprinter(testInfo.inputFilePath, {}).getRewrittenFileContents();

      expect(actual).to.equal(expected);
    });
  });
});