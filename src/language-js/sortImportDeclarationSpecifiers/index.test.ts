// Parsers
import { parse as flowParse } from "../parsers/flow/index.js";
import { parse as typescriptParse } from "../parsers/typescript/index.js";

// The methods being tested here
import {
  sortImportDeclarationSpecifiers,
  SortImportDeclarationSpecifiersOptions,
  sortImportDeclarationSpecifiersOptionsSchema,
} from "./index.js";

// Utilities
import { runTestAssetsTests } from "../../utilities/test-utils.js";
import { getParser } from "../utilities/test-utils.js";
import Ajv from "ajv";

const getSortedOverBody = (
  body: any,
  comments: any,
  input: any,
  options: SortImportDeclarationSpecifiersOptions = {
    groups: ["*", "interfaces", "types"],
  }
) => {
  let actual = input;
  body.forEach((item: any) => {
    actual = sortImportDeclarationSpecifiers(
      item.specifiers,
      comments,
      actual,
      options
    );
  });
  return actual;
};

function getSchemaValidator() {
  const ajv = new Ajv({
    useDefaults: true,
    allErrors: true,
  });
  const optionsValidator = ajv.compile(
    sortImportDeclarationSpecifiersOptionsSchema
  );
  return optionsValidator;
}

describe("language-js/sortImportDeclarationSpecifiersOptionsSchema", () => {
  it("is a valid schema", () => {
    const ajv = new Ajv();

    const isValid = ajv.validateSchema(
      sortImportDeclarationSpecifiersOptionsSchema
    );
    expect(isValid).toBe(true);
  });

  it("succeeds an empty object", () => {
    const validator = getSchemaValidator();
    const isValid = validator({});
    expect(isValid).toBe(true);
  });

  it("succeeds when there is an unknown property as it's ignored", () => {
    const validator = getSchemaValidator();
    const isValid = validator({
      not: "valid",
    });
    expect(isValid).toBe(true);
  });

  describe("groups", () => {
    it("succeeds when expected values are used", () => {
      const validator = getSchemaValidator();
      const isValid = validator({
        groups: ["*", "types"],
      });
      expect(isValid).toBe(true);
    });

    it("fails if wildcard isn't provided", () => {
      const validator = getSchemaValidator();
      const isValid = validator({
        groups: ["types"],
      });
      expect(isValid).toBe(false);
    });

    it("fails if groups contains unknown value", () => {
      const validator = getSchemaValidator();
      const isValid = validator({
        groups: ["types", "invalid"],
      });
      expect(isValid).toBe(false);
    });

    it("fails if groups are empty", () => {
      const validator = getSchemaValidator();
      const isValid = validator({
        groups: [],
      });
      expect(isValid).toBe(false);
    });

    it("fails if groups is a string", () => {
      const validator = getSchemaValidator();
      const isValid = validator({
        groups: "invalid",
      });
      expect(isValid).toBe(false);
    });
  });
});

describe("language-js/sortImportDeclarationSpecifiers", () => {
  runTestAssetsTests(
    import.meta.url,
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
      });
      expect(output).toEqual(expected);
    });

    it("Group by everything then types", () => {
      const input = 'import { type Hi, Something, IInterface } from "module";';
      const expected =
        'import { IInterface, Something, type Hi } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "types"],
      });
      expect(output).toEqual(expected);
    });

    it("Group by everything then interfaces", () => {
      const input = 'import { type Hi, Something, IInterface } from "module";';
      const expected =
        'import { type Hi, Something, IInterface } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["*", "interfaces"],
      });
      expect(output).toEqual(expected);
    });

    it("Group by interfaces then everything", () => {
      const input = 'import { type Hi, Something, IInterface } from "module";';
      const expected =
        'import { IInterface, type Hi, Something } from "module";';
      const parsed = flowParse(input);
      const output = getSortedOverBody(parsed.body, parsed.comments, input, {
        groups: ["interfaces", "*"],
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
      });
      expect(output).toEqual(expected);
    });
  });
});
