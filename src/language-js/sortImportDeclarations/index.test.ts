import { expect } from "chai";
import { runTestAssestsTests } from "../../utilities/test-utils";

// Parsers
import { parse as flowParse } from "../parsers/flow";
import { getParser } from "../utilities/test-utils";

// The methods being tested here
import { sortImportDeclarations } from "./index";

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
import honda from "./cars";
import { Apple } from "./food";`;
      const output = `import "./header.scss";
import "./styles.scss";
import { Apple } from "./food";
import * as React from "react";
import honda from "./cars";`;
      const actual = sortImportDeclarations(flowParse(input).body, input, {
        orderBy: "first-specifier",
      });

      expect(actual).to.equal(output);
    });

    it("Order by source", () => {
      const input = `import "./styles.scss";
import "./header.scss";
import * as React from "react";
import honda from "./cars";
import { Apple } from "./food";`;
      const output = `import * as React from "react";
import honda from "./cars";
import { Apple } from "./food";
import "./header.scss";
import "./styles.scss";`;
      const actual = sortImportDeclarations(flowParse(input).body, input, {
        orderBy: "source",
      });

      expect(actual).to.equal(output);
    });

    it("Order by undefined", () => {
      const input = `import "./styles.scss";
import "./header.scss";
import * as React from "react";
import honda from "./cars";
import { Apple } from "./food";`;
      const output = `import * as React from "react";
import honda from "./cars";
import { Apple } from "./food";
import "./header.scss";
import "./styles.scss";`;
      const actual = sortImportDeclarations(flowParse(input).body, input, {
        orderBy: "source",
      });

      expect(actual).to.equal(output);
    });
  });
});
