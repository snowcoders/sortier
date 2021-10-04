// Parsers
import { parse as flowParse } from "../parsers/flow/index.js";

// The methods being tested here
import { sortImportDeclarationSpecifiers } from "./index.js";

// Utilities
import { runTestAssestsTests } from "../../utilities/test-utils.js";
import { getParser } from "../utilities/test-utils.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import test from "ava";

const __dirname = dirname(fileURLToPath(import.meta.url));

const getSortedOverBody = (
  body: any,
  comments: any,
  input: any,
  options?: any
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

test("Flow - custom order > Group by everything then types then interfaces", (t) => {
  const input = 'import { type Hi, Something, IInterface } from "module";';
  const expected = 'import { Something, type Hi, IInterface } from "module";';
  const parsed = flowParse(input);
  const output = getSortedOverBody(parsed.body, parsed.comments, input, {
    groups: ["*", "types", "interfaces"],
    orderBy: "alpha",
  });
  t.is(output, expected);
});

test("Flow - custom order > Group by everything then types", (t) => {
  const input = 'import { type Hi, Something, IInterface } from "module";';
  const expected = 'import { IInterface, Something, type Hi } from "module";';
  const parsed = flowParse(input);
  const output = getSortedOverBody(parsed.body, parsed.comments, input, {
    groups: ["*", "types"],
    orderBy: "alpha",
  });
  t.is(output, expected);
});

test("Flow - custom order > Group by everything then interfaces", (t) => {
  const input = 'import { type Hi, Something, IInterface } from "module";';
  const expected = 'import { type Hi, Something, IInterface } from "module";';
  const parsed = flowParse(input);
  const output = getSortedOverBody(parsed.body, parsed.comments, input, {
    groups: ["*", "interfaces"],
    orderBy: "alpha",
  });
  t.is(output, expected);
});

test("Flow - custom order > Group by interfaces then everything", (t) => {
  const input = 'import { type Hi, Something, IInterface } from "module";';
  const expected = 'import { IInterface, type Hi, Something } from "module";';
  const parsed = flowParse(input);
  const output = getSortedOverBody(parsed.body, parsed.comments, input, {
    groups: ["interfaces", "*"],
    orderBy: "alpha",
  });
  t.is(output, expected);
});

test("Typescript - custom order > Group by interfaces then everything", (t) => {
  const input = 'import { Hi, Something, IInterface } from "module";';
  const expected = 'import { IInterface, Hi, Something } from "module";';
  const parsed = flowParse(input);
  const output = getSortedOverBody(parsed.body, parsed.comments, input, {
    groups: ["interfaces", "*"],
    orderBy: "alpha",
  });
  t.is(output, expected);
});
