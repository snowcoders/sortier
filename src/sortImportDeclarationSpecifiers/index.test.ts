import { expect } from 'chai';
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename, join, relative } from "path";

// Parsers
import { parse as flowParse } from '../parsers/flow';
import { parse as typescriptParse } from '../parsers/typescript';

// The methods being tested here
import { sortImportDeclarationSpecifiers } from './index';

// Utilities
import { sentenceCase } from "../common/string-utils";

interface TestInfo {
  parserType: string;
  testName: string;
  inputFilePath: string;
  outputFilePath: string;
}

describe('sortImportDeclarationSpecifiers', () => {
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

  let getSortedOverBody = (body, input, options?) => {
    let actual = input;
    body.forEach(item => {
      actual = sortImportDeclarationSpecifiers(item.specifiers, actual, options);
    });
    return actual;
  };

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
          it(testInfo.testName, () => {
            let input = readFileSync(testInfo.inputFilePath, "utf8");
            let expected = readFileSync(testInfo.outputFilePath, "utf8");
            let actual = getSortedOverBody(parser(input).body, input);
            expect(actual).to.equal(expected);
          });
        }
      });
    });
  });

  describe("Flow - custom order", () => {
    it("Group by everything then types then interfaces", () => {
      let input = "import { type Hi, Something, IInterface } from \"module\";";;
      let expected = "import { Something, type Hi, IInterface } from \"module\";";

      let output = getSortedOverBody(flowParse(input).body, input, {
        orderBy: "alpha",
        groups: ["*", "types", "interfaces"]
      });
      expect(output).to.equal(expected);
    });

    it("Group by everything then types", () => {
      let input = "import { type Hi, Something, IInterface } from \"module\";";;
      let expected = "import { IInterface, Something, type Hi } from \"module\";";

      let output = getSortedOverBody(flowParse(input).body, input, {
        orderBy: "alpha",
        groups: ["*", "types"]
      });
      expect(output).to.equal(expected);
    });

    it("Group by everything then interfaces", () => {
      let input = "import { type Hi, Something, IInterface } from \"module\";";;
      let expected = "import { type Hi, Something, IInterface } from \"module\";";

      let output = getSortedOverBody(flowParse(input).body, input, {
        orderBy: "alpha",
        groups: ["*", "interfaces"]
      });
      expect(output).to.equal(expected);
    });

    it("Group by interfaces then everything", () => {
      let input = "import { type Hi, Something, IInterface } from \"module\";";;
      let expected = "import { IInterface, type Hi, Something } from \"module\";";

      let output = getSortedOverBody(flowParse(input).body, input, {
        orderBy: "alpha",
        groups: ["interfaces", "*"]
      });
      expect(output).to.equal(expected);
    });
  });

  describe("Typescript - custom order", () => {
    it("Group by interfaces then everything", () => {
      let input = "import { Hi, Something, IInterface } from \"module\";";;
      let expected = "import { IInterface, Hi, Something } from \"module\";";

      let output = getSortedOverBody(typescriptParse(input).body, input, {
        orderBy: "alpha",
        groups: ["interfaces", "*"]
      });
      expect(output).to.equal(expected);
    });
  });
});