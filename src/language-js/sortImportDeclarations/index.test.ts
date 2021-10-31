import { runTestAssetsTests } from "../../utilities/test-utils.js";

// Parsers
import { parse as flowParse } from "../parsers/flow/index.js";
import { getParser } from "../utilities/test-utils.js";

// The methods being tested here
import { sortImportDeclarations } from "./index.js";

describe("language-js/sortImportDeclarations", () => {
  runTestAssetsTests(
    import.meta.url,
    (inputFilePath: string, inputFileContents: string) => {
      const parser = getParser(inputFilePath);
      const parsed = parser(inputFileContents);

      const output = sortImportDeclarations(
        parsed,
        parsed.comments,
        inputFileContents
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
