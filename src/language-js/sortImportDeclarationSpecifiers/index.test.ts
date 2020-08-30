import { expect } from "chai";

// Parsers
import { parse as flowParse } from "../parsers/flow";

// The methods being tested here
import { sortImportDeclarationSpecifiers } from "./index";

// Utilities
import { runTestAssestsTests } from "../../utilities/test-utils";
import { getParser } from "../utilities/test-utils";

let getSortedOverBody = (body, comments, input, options?) => {
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
      let parsed = parser(inputFileContents);

      let actual = getSortedOverBody(
        parsed.body,
        parsed.comments,
        inputFileContents
      );
      return actual;
    }
  );

  describe("Flow - custom order", () => {
    it("Group by everything then types then interfaces", () => {
      let input = 'import { type Hi, Something, IInterface } from "module";';
      let expected = 'import { Something, type Hi, IInterface } from "module";';
      let parsed = flowParse(input);
      let output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "types", "interfaces"],
        orderBy: "alpha",
      });
      expect(output).to.equal(expected);
    });

    it("Group by everything then types", () => {
      let input = 'import { type Hi, Something, IInterface } from "module";';
      let expected = 'import { IInterface, Something, type Hi } from "module";';
      let parsed = flowParse(input);
      let output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "types"],
        orderBy: "alpha",
      });
      expect(output).to.equal(expected);
    });

    it("Group by everything then interfaces", () => {
      let input = 'import { type Hi, Something, IInterface } from "module";';
      let expected = 'import { type Hi, Something, IInterface } from "module";';
      let parsed = flowParse(input);
      let output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "interfaces"],
        orderBy: "alpha",
      });
      expect(output).to.equal(expected);
    });

    it("Group by interfaces then everything", () => {
      let input = 'import { type Hi, Something, IInterface } from "module";';
      let expected = 'import { IInterface, type Hi, Something } from "module";';
      let parsed = flowParse(input);
      let output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["interfaces", "*"],
        orderBy: "alpha",
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
        orderBy: "alpha",
      });
      expect(output).to.equal(expected);
    });
  });
});
