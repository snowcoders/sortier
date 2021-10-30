import { runTestAssetsTests } from "../../utilities/test-utils.js";
import { parse as typescriptParse } from "../parsers/typescript/index.js";
import { getParser } from "../utilities/test-utils.js";
// The methods being tested here
import { sortExpression } from "./index.js";

describe("language-js/sortExpression", () => {
  runTestAssetsTests(
    import.meta.url,
    (inputFilePath: string, inputFileContents: string) => {
      const parser = getParser(inputFilePath);
      const parsed = parser(inputFileContents);
      const actual = sortExpression(
        parsed.body[0].declarations[0].init,
        parsed.comments,
        inputFileContents,
        {}
      );
      return actual;
    }
  );

  it("Respects a custom order", () => {
    const input = `let example = 1 | null | undefined`;
    const expected = `let example = null | undefined | 1`;
    const parsed = typescriptParse(input);
    const actual = sortExpression(
      // @ts-expect-error: This is a test... it will fail if declarations doesn't exist
      parsed.body[0].declarations[0].init,
      parsed.comments,
      input,
      {
        groups: ["null", "undefined"],
      }
    );

    expect(actual).toEqual(expected);
  });

  it("Sets the order if groups is missing from options", () => {
    const input = `let example = 1 | null | undefined`;
    const expected = `let example = undefined | null | 1`;
    const parsed = typescriptParse(input);
    const actual = sortExpression(
      // @ts-expect-error: This is a test... it will fail if declarations doesn't exist
      parsed.body[0].declarations[0].init,
      parsed.comments,
      input,
      {
        groups: undefined,
      }
    );

    expect(actual).toEqual(expected);
  });
});
