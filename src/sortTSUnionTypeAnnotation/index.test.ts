import { expect } from 'chai';
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename, join, relative } from "path";

// Parsers
import { parse as flowParse } from '../parsers/flow';
import { parse as javascriptParse } from '../parsers/javascript';
import { parse as typescriptParse } from '../parsers/typescript';

// The methods being tested here
import { sortTSUnionTypeAnnotation } from './index';

// Utilities
import { sentenceCase } from "../common/string-utils";

interface TestInfo {
  parserType: string;
  testName: string;
  inputFilePath: string;
  outputFilePath: string;
}

describe('sortTSUnionTypeAnnotation', () => {
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
          it(testInfo.testName, () => {
            let input = readFileSync(testInfo.inputFilePath, "utf8");
            let expected = readFileSync(testInfo.outputFilePath, "utf8");
            let parsed = parser(input);
            let actual = sortTSUnionTypeAnnotation(parsed.body[0].body.body[0].typeAnnotation, parsed.comments, input);

            expect(actual).to.equal(expected);
          });
        }
      });
    });
  });
});