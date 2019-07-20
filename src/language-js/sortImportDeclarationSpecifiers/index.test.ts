import { expect } from "chai";
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename } from "path";

// Parsers
import { parse as flowParse } from "../parsers/flow";
import { parse as typescriptParse } from "../parsers/typescript";

// The methods being tested here
import { sortImportDeclarationSpecifiers } from "./index";

// Utilities
import { StringUtils } from "../../utilities/string-utils";
import { FileUtils } from "../../utilities/file-utils";

interface TestInfo {
  inputFilePath: string;
  outputFilePath: string;
  parserType: string;
  testName: string;
}

describe("language-js/sortImportDeclarationSpecifiers", () => {
  let parserTypes: string[];
  let testInfos: TestInfo[];

  parserTypes = [];

  let assetsFolderPath = FileUtils.globbyJoin(
    __dirname,
    "test_assets/*.input.txt"
  );
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

  let getSortedOverBody = (body, comments, input, options?) => {
    let actual = input;
    body.forEach(item => {
      actual = sortImportDeclarationSpecifiers(
        item.specifiers,
        comments,
        actual,
        options
      );
    });
    return actual;
  };

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
          it(testInfo.testName, () => {
            let input = readFileSync(testInfo.inputFilePath, "utf8");
            let expected = readFileSync(testInfo.outputFilePath, "utf8");
            let parsed = parser(input);
            let actual = getSortedOverBody(parsed.body, parsed.comments, input);
            expect(actual).to.equal(expected);
          });
        }
      });
    });
  });

  describe("Flow - custom order", () => {
    it("Group by everything then types then interfaces", () => {
      let input = 'import { type Hi, Something, IInterface } from "module";';
      let expected = 'import { Something, type Hi, IInterface } from "module";';
      let parsed = flowParse(input);
      let output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "types", "interfaces"],
        orderBy: "alpha"
      });
      expect(output).to.equal(expected);
    });

    it("Group by everything then types", () => {
      let input = 'import { type Hi, Something, IInterface } from "module";';
      let expected = 'import { IInterface, Something, type Hi } from "module";';
      let parsed = flowParse(input);
      let output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "types"],
        orderBy: "alpha"
      });
      expect(output).to.equal(expected);
    });

    it("Group by everything then interfaces", () => {
      let input = 'import { type Hi, Something, IInterface } from "module";';
      let expected = 'import { type Hi, Something, IInterface } from "module";';
      let parsed = flowParse(input);
      let output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "interfaces"],
        orderBy: "alpha"
      });
      expect(output).to.equal(expected);
    });

    it("Group by interfaces then everything", () => {
      let input = 'import { type Hi, Something, IInterface } from "module";';
      let expected = 'import { IInterface, type Hi, Something } from "module";';
      let parsed = flowParse(input);
      let output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["interfaces", "*"],
        orderBy: "alpha"
      });
      expect(output).to.equal(expected);
    });
  });

  describe("Typescript - custom order", () => {
    it("Group by interfaces then everything", () => {
      let input = 'import { Hi, Something, IInterface } from "module";';
      let expected = 'import { IInterface, Hi, Something } from "module";';
      let parsed = flowParse(input);
      let output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["interfaces", "*"],
        orderBy: "alpha"
      });
      expect(output).to.equal(expected);
    });
  });
});
