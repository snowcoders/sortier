import { formatFile, formatText } from "./index.js";
import { FileUtils } from "./utilities/file-utils.js";
import { getFolderPathFromFileUrl } from "./utilities/test-utils.js";

const currentFolderPath = getFolderPathFromFileUrl(import.meta.url);

describe("index", () => {
  it("Runs without crashing", () => {
    const thisFile = FileUtils.globbyJoin(currentFolderPath, "index.test.ts");
    formatFile(thisFile, {
      isTestRun: true,
    });
  });

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
});
