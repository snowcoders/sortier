// Parsers
import { parse as flowParse } from "../parsers/flow/index.js";
import { parse as typescriptParse } from "../parsers/typescript/index.js";

// The methods being tested here
import { sortImportDeclarationSpecifiers } from "./index.js";

// Utilities
import { runTestAssetsTests } from "../../utilities/test-utils.js";
import { getParser } from "../utilities/test-utils.js";

const getSortedOverBody = (body: any, comments: any, input: any, options?: any) => {
  let actual = input;
  body.forEach((item: any) => {
    actual = sortImportDeclarationSpecifiers(item.specifiers, comments, actual, options);
  });
  return actual;
};

describe("language-js/sortImportDeclarationSpecifiers", () => {
  runTestAssetsTests(import.meta.url, (inputFilePath: string, inputFileContents: string) => {
    const parser = getParser(inputFilePath);
    const parsed = parser(inputFileContents);

    const actual = getSortedOverBody(parsed.body, parsed.comments, inputFileContents);
    return actual;
  });

  describe("Flow - custom order", () => {
    it("Group by everything then types then interfaces", () => {
      const input = 'import { type Hi, Something, IInterface } from "module";';
      const expected = 'import { Something, type Hi, IInterface } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "types", "interfaces"],
        orderBy: "alpha",
      });
      expect(output).toEqual(expected);
    });

    it("Group by everything then types", () => {
      const input = 'import { type Hi, Something, IInterface } from "module";';
      const expected = 'import { IInterface, Something, type Hi } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "types"],
        orderBy: "alpha",
      });
      expect(output).toEqual(expected);
    });

    it("Group by everything then interfaces", () => {
      const input = 'import { type Hi, Something, IInterface } from "module";';
      const expected = 'import { type Hi, Something, IInterface } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "interfaces"],
        orderBy: "alpha",
      });
      expect(output).toEqual(expected);
    });

    it("Group by interfaces then everything", () => {
      const input = 'import { type Hi, Something, IInterface } from "module";';
      const expected = 'import { IInterface, type Hi, Something } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["interfaces", "*"],
        orderBy: "alpha",
      });
      expect(output).toEqual(expected);
    });
  });

  describe("Typescript - custom order", () => {
    it("Group by interfaces then everything", () => {
      const input = 'import { Hi, Something, IInterface } from "module";';
      const expected = 'import { IInterface, Hi, Something } from "module";';
      const parsed = typescriptParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["interfaces", "*"],
        orderBy: "alpha",
      });
      expect(output).toEqual(expected);
    });
  });
});
