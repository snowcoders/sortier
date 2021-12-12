import { formatText } from "./index.js";

it("Runs formatText without crashing", () => {
  const result = formatText("ts", "let a = {b: 'b', a: 'a'};", {
    isTestRun: true,
  });
  expect(result).toEqual("let a = {a: 'a', b: 'b'};");
});

describe("Validating option overrides", () => {
  it("js.sortImportDeclarationSpecifiers.groups = undefined", () => {
    const result = formatText("ts", "import { IP, Po } from '@foo';", {
      js: {
        sortImportDeclarationSpecifiers: {
          groups: undefined,
        },
      },
    });
    expect(result).toEqual("import { Po, IP } from '@foo';");
  });

  it("js.sortImportDeclarationSpecifiers.groups = *", () => {
    const result = formatText("ts", "import { Po, IP } from '@foo';", {
      js: {
        sortImportDeclarationSpecifiers: {
          groups: ["*"],
        },
      },
    });
    expect(result).toEqual("import { IP, Po } from '@foo';");
  });
});
