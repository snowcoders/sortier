import { sentenceCase } from "../common/string-utils";
import { expect } from 'chai';
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename, join, relative } from "path";

// Parsers
import { parse as flowParse } from '../parsers/flow';
import { parse as typescriptParse } from '../parsers/typescript';

// The methods being tested here
import { Reprinter } from './index';

interface TestInfo {
  parserType: string;
  testName: string;
  inputFilePath: string;
  outputFilePath: string;
}

describe('reprinter', () => {
  let testInfos: TestInfo[];
  let parserTypes: Set<string> = new Set<string>();

  let assetsFolderPath = join(__dirname, "test_assets/*.input.(js|ts).txt");
  testInfos = sync(assetsFolderPath).map(filePath => {
    let segments = basename(filePath).split(".");

    let parserType = sentenceCase(segments[0]);
    parserTypes.add(parserType);
    let cleanedTestName = segments[1].replace(/_/g, " ").toLowerCase();
    cleanedTestName = sentenceCase(cleanedTestName);

    return {
      parserType: parserType,
      testName: cleanedTestName,
      inputFilePath: filePath,
      outputFilePath: filePath.replace(".input.", ".output.")
    };
  });

  it("Setup succeeds", () => {
    expect(testInfos.length).to.not.equal(0, "Expected to find at least one test");
  });

  parserTypes.forEach((parserType) => {
    describe(parserType, () => {
      testInfos.forEach(testInfo => {
        if (testInfo.parserType === parserType) {
          // Useful if you need to test a single file
          //if (testInfo.inputFilePath.includes("flow"))
          it(testInfo.testName, () => {
            let input = readFileSync(testInfo.inputFilePath, "utf8");
            let expected = readFileSync(testInfo.outputFilePath, "utf8");
            let actual = new Reprinter(testInfo.inputFilePath, {}).getRewrittenFileContents();

            expect(actual).to.equal(expected);
          });
        }
      });
    });
  });
});