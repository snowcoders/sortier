import { expect } from "chai";
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename } from "path";

// Parsers
import { parse as flowParse } from "../parsers/flow";
import { parse as typescriptParse } from "../parsers/typescript";

// The methods being tested here
import { sortExpression } from "./index";

// Utilities
import { FileUtils } from "../../utilities/file-utils";
import { StringUtils } from "../../utilities/string-utils";

interface TestInfo {
  inputFilePath: string;
  outputFilePath: string;
  parserType: string;
  testName: string;
}

describe("language-js/sortExpression", () => {
  let parserTypes: string[];
  let testInfos: TestInfo[];

  parserTypes = [];

  let assetsFolderPath = FileUtils.globbyJoin(
    __dirname,
    "test_assets/*.input.txt"
  );
  testInfos = sync(assetsFolderPath).map((filePath) => {
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
      testName: cleanedTestName,
    };
  });

  parserTypes.forEach((fileType) => {
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

      testInfos.forEach((testInfo) => {
        if (testInfo.parserType == fileType) {
          it(testInfo.testName, () => {
            let input = readFileSync(testInfo.inputFilePath, "utf8");
            let expected = readFileSync(testInfo.outputFilePath, "utf8");
            let parsed = parser(input);
            let actual = sortExpression(
              parsed.body[0].declarations[0].init,
              parsed.comments,
              input,
              {}
            );

            expect(actual).to.equal(expected);
          });
        }
      });
    });
  });

  it("Respects a custom order", () => {
    let input = `let example = 1 | null | undefined`;
    let expected = `let example = null | undefined | 1`;
    let parsed = typescriptParse(input);
    let actual = sortExpression(
      parsed.body[0].declarations[0].init,
      parsed.comments,
      input,
      {
        groups: ["null", "undefined"],
      }
    );

    expect(actual).to.equal(expected);
  });

  it("Sets the order if groups is missing from options", () => {
    let input = `let example = 1 | null | undefined`;
    let expected = `let example = undefined | null | 1`;
    let parsed = typescriptParse(input);
    let actual = sortExpression(
      parsed.body[0].declarations[0].init,
      parsed.comments,
      input,
      {
        groups: undefined,
      }
    );

    expect(actual).to.equal(expected);
  });
});
