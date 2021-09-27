import { runTestAssestsTests } from "../../utilities/test-utils.js";

// Parsers
import { parse as flowParse } from "../parsers/flow/index.js";
import { getParser } from "../utilities/test-utils.js";

// The methods being tested here
import { sortImportDeclarations } from "./index.js";

describe("language-js/sortImportDeclarations", () => {
  runTestAssestsTests(
    __dirname,
    (inputFilePath: string, inputFileContents: string) => {
      const parser = getParser(inputFilePath);
      const parsed = parser(inputFileContents);

      return sortImportDeclarations(parsed.body, inputFileContents);
    }
  );

  describe("es6 - Custom options", () => {
    it("Order by first specifier", () => {
      const input = `import "./styles.scss";
import "./header.scss";
import * as React from "react";
import honda from "./cars.js";
import { Apple } from "./food.js";`;
      const output = `import "./header.scss";
import "./styles.scss";
import { Apple } from "./food.js";
import * as React from "react";
import honda from "./cars.js";`;
      const actual = sortImportDeclarations(flowParse(input).body, input, {
        orderBy: "first-specifier",
      });

      expect(actual).toEqual(output);
    });

    it("Order by source", () => {
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
      const actual = sortImportDeclarations(flowParse(input).body, input, {
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
      const actual = sortImportDeclarations(flowParse(input).body, input, {
        orderBy: "source",
      });

      expect(actual).toEqual(output);
    });
  });
});
