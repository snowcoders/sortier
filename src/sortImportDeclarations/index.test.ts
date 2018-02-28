import { expect } from 'chai';
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename, join, relative } from "path";

// Parsers
import { parse as flowParse } from '../parsers/flow';
import { parse as javascriptParse } from '../parsers/javascript';
import { parse as typescriptParse } from '../parsers/typescript';

// The methods being tested here
import { sortImportDeclarations } from './index';

interface TestInfo {
  parserType: string;
  testName: string;
  inputFilePath: string;
  outputFilePath: string;
}

describe('sortImportDeclarations', () => {
  let parserTypes: string[];
  let testInfos: TestInfo[];

  parserTypes = [];

  let assetsFolderPath = join(__dirname, "test_assets/*.input.txt");
  testInfos = sync(assetsFolderPath).map(filePath => {
    let segments = basename(filePath).split(".");

    if (parserTypes.indexOf(segments[0]) === -1) {
      parserTypes.push(segments[0]);
    }

    let cleanedTestName = segments[1].replace(/_/g, " ").toLowerCase();
    cleanedTestName = cleanedTestName.charAt(0).toUpperCase() + cleanedTestName.slice(1);

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
        if (testInfo.parserType == fileType) {
          describe(testInfo.testName, () => {

            it("Unix line endings", () => {
              let input = readFileSync(testInfo.inputFilePath, "utf8");
              let expected = readFileSync(testInfo.outputFilePath, "utf8");
              if (input.indexOf("\r") !== -1) {
                input = input.replace(/\r/g, "");
                expected = expected.replace(/\r/g, "");
              }
              let actual = sortImportDeclarations(parser(input).body, input);

              expect(actual).to.equal(expected);
            });

            it("Windows line endings", () => {
              let input = readFileSync(testInfo.inputFilePath, "utf8");
              let expected = readFileSync(testInfo.outputFilePath, "utf8");
              if (input.indexOf("\r") === -1) {
                input = input.replace(/\n/g, "\r\n");
                expected = expected.replace(/\n/g, "\r\n");
              }
              let actual = sortImportDeclarations(parser(input).body, input);

              expect(actual).to.equal(expected);
            });
          });
        }
      });
    });
  });

  describe("Sort by first specifier", () => {
    it("", () => {
      let input = `import "./styles.scss";
import "./header.scss";
import * as React from "react";
import honda from "./cars";
import { Apple } from "./food";`;
      let output = `import "./header.scss";
import "./styles.scss";
import { Apple } from "./food";
import honda from "./cars";
import * as React from "react";`;
      let actual = sortImportDeclarations(flowParse(input).body, input, {
        orderBy: "first_specifier"
      });

      expect(actual).to.equal(output);
    });
  });
});