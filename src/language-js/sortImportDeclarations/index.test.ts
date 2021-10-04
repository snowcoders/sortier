import { runTestAssestsTests } from "../../utilities/test-utils.js";

// Parsers
import { parse as flowParse } from "../parsers/flow/index.js";
import { getParser } from "../utilities/test-utils.js";

// The methods being tested here
import { sortImportDeclarations } from "./index.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import test from "ava";

const __dirname = dirname(fileURLToPath(import.meta.url));

runTestAssestsTests(
  __dirname,
  (inputFilePath: string, inputFileContents: string) => {
    const parser = getParser(inputFilePath);
    const parsed = parser(inputFileContents);

    return sortImportDeclarations(parsed.body, inputFileContents);
  }
);

test("es6 - Custom options > Order by first specifier", (t) => {
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

  t.is(actual, output);
});

test("es6 - Custom options > Order by source", (t) => {
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

  t.is(actual, output);
});

test("es6 - Custom options > Order by undefined", (t) => {
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

  t.is(actual, output);
});
