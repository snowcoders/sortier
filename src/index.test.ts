import { expect } from "chai";
import { formatFile, formatText } from "./index";
import { FileUtils } from "./utilities/file-utils";

describe("index", () => {
  it("Runs without crashing", () => {
    let thisFile = FileUtils.globbyJoin(__dirname, "index.test.ts");
    formatFile(thisFile, {
      isTestRun: true
    });
  });

  it("Runs formatText without crashing", () => {
    let result = formatText("ts", "let a = {b: 'b', a: 'a'};", {
      isTestRun: true
    });
    expect(result).to.equal("let a = {a: 'a', b: 'b'};");
  });

  describe("Validating option overrides", () => {
    it("js.sortImportDeclarationSpecifiers.groups = undefined", () => {
      let result = formatText("ts", "import { IP, Po } from '@foo';", {
        js: {
          sortImportDeclarationSpecifiers: {
            groups: undefined
          }
        }
      });
      expect(result).to.equal("import { Po, IP } from '@foo';");
    });

    it("js.sortImportDeclarationSpecifiers.groups = *", () => {
      let result = formatText("ts", "import { Po, IP } from '@foo';", {
        js: {
          sortImportDeclarationSpecifiers: {
            groups: ["*"]
          }
        }
      });
      expect(result).to.equal("import { IP, Po } from '@foo';");
    });
  });
});
