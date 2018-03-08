import { expect } from 'chai';
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename, join, relative } from "path";

// Parsers
import { parse as flowParse } from '../parsers/flow';
import { parse as typescriptParse } from '../parsers/typescript';

// The methods being tested here
import { sortVariableDeclarator } from './index';

// Utilities
import { sentenceCase } from "../common/string-utils";

interface TestInfo {
  parserType: string;
  testName: string;
  inputFilePath: string;
  outputFilePath: string;
}

describe('sortVariableDeclarator', () => {
  let parserTypes: string[];
  let testInfos: TestInfo[];

  parserTypes = [];

  let assetsFolderPath = join(__dirname, "test_assets/*.input.txt");
  testInfos = sync(assetsFolderPath).map(filePath => {
    let segments = basename(filePath).split(".");

    if (parserTypes.indexOf(segments[0]) === -1) {
      parserTypes.push(segments[0]);
    }

    let cleanedTestName = sentenceCase(segments[1].replace(/_/g, " "));

    return {
      parserType: segments[0],
      testName: cleanedTestName,
      inputFilePath: filePath,
      outputFilePath: filePath.replace(".input.txt", ".output.txt")
    };
  });

  parserTypes.forEach(fileType => {
    describe(fileType, () => {

      let parser = null;
      switch (fileType) {
        case "flow":
        case "es6":
          parser = flowParse;
          break;
        case "typescript":
          parser = typescriptParse;
          break;
        default:
          throw new Error("Unknown parser passed - " + fileType + ". Expected 'flow', 'typescript' or 'es6'.");
      }

      testInfos.forEach(testInfo => {
        if (testInfo.parserType == fileType) {
          // Useful if you want to test a single test
          if (testInfo.inputFilePath.includes("mixed_binary_and_logical"))
            it(testInfo.testName, () => {
              let input = readFileSync(testInfo.inputFilePath, "utf8");
              let expected = readFileSync(testInfo.outputFilePath, "utf8");
              let actual = sortVariableDeclarator(parser(input).body, input);

              expect(actual).to.equal(expected);
            });
        }
      });
    });
  });
});