import { validateOptions } from "./validate-options.js";
import fs from "fs";
import path from "path";

it("successfully populates missing objects", () => {
  const initialValue = {};
  const options = validateOptions(initialValue);

  expect(initialValue).toStrictEqual({});
  expect(options).toStrictEqual({
    isTestRun: false,
    logLevel: "normal",
    css: {
      parser: null,
      sortDeclarations: {
        overrides: [],
      },
    },
    js: {
      parser: "typescript",
      sortImportDeclarationSpecifiers: {
        groups: ["*", "interfaces", "types"],
      },
      sortImportDeclarations: {
        orderBy: "source",
      },
      sortTypeAnnotations: ["undefined", "null", "*", "function"],
    },
  });
});

describe("invalid scenarios", () => {
  it("throws error if isTestRun is not an expected value", () => {
    expect(() => {
      validateOptions({
        isTestRun: "hello",
      });
    }).toThrow("options/isTestRun must be boolean");
  });

  it("throws error if isTestRun and logLevel is not an expected value", () => {
    expect(() => {
      validateOptions({
        isTestRun: "hello",
        logLevel: "world",
      });
    }).toThrow(
      "options/isTestRun must be boolean, options/logLevel must be equal to one of the allowed values"
    );
  });
});

describe("Configs from docs", () => {
  const testCases = getLangToOptionPaths();
  for (const [key, entries] of testCases) {
    describe(key, () => {
      for (const entry of entries) {
        const { description, path } = entry;
        it(`${description} is valid`, async () => {
          const config = await import(path);

          expect(() => {
            validateOptions(config.default);
          }).not.toThrow();
        });
      }
    });
  }
});

function getLangToOptionPaths() {
  const map = new Map<
    string,
    {
      description: string;
      path: string;
    }[]
  >();

  const docOptionsPath = path.resolve("docs", "options");
  const dir = fs.readdirSync(docOptionsPath);
  for (const dirent of dir) {
    const isJson = path.extname(dirent) === ".json";
    if (!isJson) {
      continue;
    }
    const baseName = path.basename(dirent);
    const [category, description] = baseName.split("-", 2);
    if (category == null || description == null) {
      continue;
    }

    const value = map.get(category) ?? [];
    if (!map.has(category)) {
      map.set(category, value);
    }
    value.push({
      description: baseName,
      path: path.join(docOptionsPath, dirent),
    });
  }

  return map;
}
