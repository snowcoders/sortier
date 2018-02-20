import { expect } from 'chai';
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename, join, relative } from "path";

// Parsers
import { parse as flowParse } from '../parsers/flow';
import { parse as javascriptParse } from '../parsers/javascript';
import { parse as typescriptParse } from '../parsers/typescript';

// The methods being tested here
import * as methodsToTest from './index';

interface TestInfo {
  parserType: string;
  methodTested: string;
  testName: string;
  inputFilePath: string;
  outputFilePath: string;
}

describe('sortImportDeclarations', () => {
  let parserTypes: string[];
  let methodNames: string[];
  let testInfos: TestInfo[];

  parserTypes = [];
  methodNames = [];

  let assetsFolderPath = join(__dirname, "test_assets/*.input.txt");
  testInfos = sync(assetsFolderPath).map(filePath => {
    let segments = basename(filePath).split(".");

    if (parserTypes.indexOf(segments[1]) === -1) {
      parserTypes.push(segments[1]);
    }
    if (methodNames.indexOf(segments[0]) === -1) {
      methodNames.push(segments[0]);
    }

    let cleanedTestName = segments[2].replace(/_/g, " ").toLowerCase();
    cleanedTestName = cleanedTestName.charAt(0).toUpperCase() + cleanedTestName.slice(1);

    return {
      parserType: segments[1],
      methodTested: segments[0],
      testName: cleanedTestName,
      inputFilePath: filePath,
      outputFilePath: filePath.replace(".input.txt", ".output.txt")
    };
  });

  it("Setup succeeds", () => {
    expect(testInfos.length).to.not.equal(0, "Expected to find at least one test");
    methodNames.forEach(methodName => {
      expect(methodsToTest[methodName], "Method could not be found on imported index.ts").to.exist;
    });
  });

  methodNames.forEach(methodName => {
    describe(methodName, () => {
      parserTypes.forEach(fileType => {
        describe(fileType, () => {

          let parser = null;
          switch (fileType) {
            case "flow":
              parser = flowParse;
              break;
            case "es6":
              parser = flowParse;//javascriptParse;
              break;
            case "typescript":
              parser = typescriptParse;
              break;
            default:
              throw new Error("Unknown parser passed - " + fileType + ". Expected 'flow', 'typescript' or 'es6'.");
          }

          testInfos.forEach(testInfo => {
            if (testInfo.methodTested == methodName &&
              testInfo.parserType == fileType) {
              describe(testInfo.testName, () => {

                it("Unix line endings", () => {
                  let input = readFileSync(testInfo.inputFilePath, "utf8").replace(/\r/g, "");
                  let expected = readFileSync(testInfo.outputFilePath, "utf8").replace(/\r/g, "");
                  let actual = methodsToTest[methodName](parser, input);

                  expect(actual).to.equal(expected);
                });
                it("Windows line endings", () => {
                  let input = readFileSync(testInfo.inputFilePath, "utf8")
                  let expected = readFileSync(testInfo.outputFilePath, "utf8")
                  let actual = methodsToTest[methodName](parser, input);

                  expect(actual).to.equal(expected);
                });
              });
            }
          });
        });
      });
    });
  });
});