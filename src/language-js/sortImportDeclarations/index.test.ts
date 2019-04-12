import { expect } from "chai";
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename, join } from "path";

// Parsers
import { parse as flowParse } from "../parsers/flow";
import { parse as typescriptParse } from "../parsers/typescript";

// The methods being tested here
import { sortImportDeclarations } from "./index";

// Utilities
import { StringUtils } from "../../utilities/string-utils";

interface TestInfo {
  inputFilePath: string;
  outputFilePath: string;
  parserType: string;
  testName: string;
}

describe("language-js/sortImportDeclarations", () => {
  let parserTypes: string[];
  let testInfos: TestInfo[];

  parserTypes = [];

  let assetsFolderPath = join(__dirname, "test_assets/*.input.txt");
  testInfos = sync(assetsFolderPath).map(filePath => {
    let segments = basename(filePath).split(".");

    if (parserTypes.indexOf(segments[0]) === -1) {
      parserTypes.push(segments[0]);
    }

    let cleanedTestName = StringUtils.sentenceCase(
      segments[1].replace(/_/g, " ")
    );

    return {
      inputFilePath: filePath,
      outputFilePath: filePath.replace(".input.txt", ".output.txt"),
      parserType: segments[0],
      testName: cleanedTestName
    };
  });

  parserTypes.forEach(fileType => {
    describe(fileType, () => {
      let parser;
      switch (fileType) {
        case "es6":
        case "flow":
          parser = flowParse;
          break;
        case "typescript":
          parser = typescriptParse;
          break;
        default:
          throw new Error(
            "Unknown parser passed - " +
              fileType +
              ". Expected 'flow', 'typescript' or 'es6'."
          );
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

  describe("es6 - Custom options", () => {
    it("Sort by first specifier", () => {
      let input = `import "./styles.scss";
import "./header.scss";
import * as React from "react";
import honda from "./cars";
import { Apple } from "./food";`;
      let output = `import "./header.scss";
import "./styles.scss";
import { Apple } from "./food";
import * as React from "react";
import honda from "./cars";`;
      let actual = sortImportDeclarations(flowParse(input).body, input, {
        orderBy: "first-specifier"
      });

      expect(actual).to.equal(output);
    });
  });
});
