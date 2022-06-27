import Ajv from "ajv";
import { runTestAssetsTests } from "../../utilities/test-utils.js";

// Parsers
import { parse as flowParse } from "../parsers/flow/index.js";
import { getParser } from "../utilities/test-utils.js";

// The methods being tested here
import {
  sortImportDeclarations,
  sortImportDeclarationsOptionsSchema,
} from "./index.js";

function getSchemaValidator() {
  const ajv = new Ajv({
    useDefaults: true,
    allErrors: true,
  });
  const optionsValidator = ajv.compile(sortImportDeclarationsOptionsSchema);
  return optionsValidator;
}

describe("language-js/sortImportDeclarationsOptionsSchema", () => {
  it("is a valid schema", () => {
    const ajv = new Ajv();

    const isValid = ajv.validateSchema(sortImportDeclarationsOptionsSchema);
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

  describe("orderBy", () => {
    it("succeeds when value is source", () => {
      const validator = getSchemaValidator();
      const isValid = validator({
        orderBy: "source",
      });
      expect(isValid).toBe(true);
    });

    it("succeeds when value is first-specifier", () => {
      const validator = getSchemaValidator();
      const isValid = validator({
        orderBy: "first-specifier",
      });
      expect(isValid).toBe(true);
    });

    it("fails when value is invalid", () => {
      const validator = getSchemaValidator();
      const isValid = validator({
        orderBy: "invalid",
      });
      expect(isValid).toBe(false);
    });

    it("fails when value is an empty array", () => {
      const validator = getSchemaValidator();
      const isValid = validator({
        orderBy: [],
      });
      expect(isValid).toBe(false);
    });
  });
});

describe("language-js/sortImportDeclarations", () => {
  runTestAssetsTests(
    import.meta.url,
    (inputFilePath: string, inputFileContents: string) => {
      const parser = getParser(inputFilePath);
      const parsed = parser(inputFileContents);

      const output = sortImportDeclarations(
        parsed,
        parsed.comments,
        inputFileContents,
        {
          orderBy: "source",
        }
      );
      return output;
    }
  );

  describe("es6 - Custom options", () => {
    it("Order by first specifier", () => {
      const input = `import "./styles.scss";
import "./header.scss";
import * as React from "react";
import honda from "./cars.js";
import { Banana } from "./food.js";
import { Apple } from "./food.js";`;
      const output = `import "./header.scss";
import "./styles.scss";
import { Apple } from "./food.js";
import { Banana } from "./food.js";
import * as React from "react";
import honda from "./cars.js";`;

      const parsed = flowParse(input);
      const actual = sortImportDeclarations(parsed, parsed.comments, input, {
        orderBy: "first-specifier",
      });

      expect(actual).toEqual(output);
    });

    it("Order by source", () => {
      const input = `import "./styles.scss";
import "./header.scss";
import * as React from "react";
import honda from "./cars.js";
import { Banana } from "./food.js";
import { Apple } from "./food.js";`;
      const output = `import * as React from "react";
import honda from "./cars.js";
import { Apple } from "./food.js";
import { Banana } from "./food.js";
import "./header.scss";
import "./styles.scss";`;

      const parsed = flowParse(input);
      const actual = sortImportDeclarations(parsed, parsed.comments, input, {
        orderBy: "source",
      });

      expect(actual).toEqual(output);
    });

    it("Order by undefined", () => {
      const input = `import "./styles.scss";
import "./header.scss";
import * as React from "react";
import honda from "./cars.js";
import { Apple } from "./food.js";`;
      const output = `import * as React from "react";
import honda from "./cars.js";
import { Apple } from "./food.js";
import "./header.scss";
import "./styles.scss";`;

      const parsed = flowParse(input);
      const actual = sortImportDeclarations(parsed, parsed.comments, input, {
        orderBy: "source",
      });

      expect(actual).toEqual(output);
    });
  });
});
