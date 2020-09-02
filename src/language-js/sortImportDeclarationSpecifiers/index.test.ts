import { expect } from "chai";

// Parsers
import { parse as flowParse } from "../parsers/flow";

// The methods being tested here
import { sortImportDeclarationSpecifiers } from "./index";

// Utilities
import { runTestAssestsTests } from "../../utilities/test-utils";
import { getParser } from "../utilities/test-utils";

const getSortedOverBody = (body, comments, input, options?) => {
  let actual = input;
  body.forEach((item) => {
    actual = sortImportDeclarationSpecifiers(
      item.specifiers,
      comments,
      actual,
      options
    );
  });
  return actual;
};

describe("language-js/sortImportDeclarationSpecifiers", () => {
  runTestAssestsTests(
    __dirname,
    (inputFilePath: string, inputFileContents: string) => {
      const parser = getParser(inputFilePath);
      const parsed = parser(inputFileContents);

      const actual = getSortedOverBody(
        parsed.body,
        parsed.comments,
        inputFileContents
      );
      return actual;
    }
  );

  describe("Flow - custom order", () => {
    it("Group by everything then types then interfaces", () => {
      const input = 'import { type Hi, Something, IInterface } from "module";';
      const expected =
        'import { Something, type Hi, IInterface } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "types", "interfaces"],
        orderBy: "alpha",
      });
      expect(output).to.equal(expected);
    });

    it("Group by everything then types", () => {
      const input = 'import { type Hi, Something, IInterface } from "module";';
      const expected =
        'import { IInterface, Something, type Hi } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "types"],
        orderBy: "alpha",
      });
      expect(output).to.equal(expected);
    });

    it("Group by everything then interfaces", () => {
      const input = 'import { type Hi, Something, IInterface } from "module";';
      const expected =
        'import { type Hi, Something, IInterface } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "interfaces"],
        orderBy: "alpha",
      });
      expect(output).to.equal(expected);
    });

    it("Group by interfaces then everything", () => {
      const input = 'import { type Hi, Something, IInterface } from "module";';
      const expected =
        'import { IInterface, type Hi, Something } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["interfaces", "*"],
        orderBy: "alpha",
      });
      expect(output).to.equal(expected);
    });
  });

  describe("Typescript - custom order", () => {
    it("Group by interfaces then everything", () => {
      const input = 'import { Hi, Something, IInterface } from "module";';
      const expected = 'import { IInterface, Hi, Something } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["interfaces", "*"],
        orderBy: "alpha",
      });
      expect(output).to.equal(expected);
    });
  });
});
