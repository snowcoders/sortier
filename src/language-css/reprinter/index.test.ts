import { expect } from "chai";
import { sync } from "globby";
import { basename, join } from "path";

// The methods being tested here
import { Reprinter } from "./index";

// Utilities
import { FileUtils } from "../../utilities/file-utils";
import { StringUtils } from "../../utilities/string-utils";

interface TestInfo {
  inputFilePath: string;
  outputFilePath: string;
  testName: string;
}

describe("language-css/reprinter", () => {
  ["css", "scss", "less"].forEach((cssType) => {
    let testInfos: TestInfo[];

    let assetsFolderPath = FileUtils.globbyJoin(
      __dirname,
      `test_assets/*.input.${cssType}.txt`
    );
    testInfos = sync(assetsFolderPath).map((filePath) => {
      let segments = basename(filePath).split(".");

      let cleanedTestName = StringUtils.sentenceCase(
        segments[0].replace(/_/g, " ")
      );

      return {
        inputFilePath: filePath,
        outputFilePath: filePath.replace(".input.", ".output."),
        parserType: segments[2],
        testName: cleanedTestName,
      };
    });

    describe(cssType, () => {
      testInfos.forEach((testInfo) => {
        it(testInfo.testName, () => {
          let input = FileUtils.readFileContents(testInfo.inputFilePath);
          let expected = FileUtils.readFileContents(testInfo.outputFilePath);
          let actual = new Reprinter().getRewrittenContents(
            testInfo.inputFilePath,
            input,
            {}
          );

          expect(actual).to.equal(expected);
        });
      });
    });
  });

  describe("Default file support", () => {
    it("Supports css", () => {
      new Reprinter().isFileSupported("test.css");
    });

    it("Supports scss", () => {
      new Reprinter().isFileSupported("test.scss");
    });

    it("Supports less", () => {
      new Reprinter().isFileSupported("test.less");
    });
  });

  describe("Overriding sortDeclarations' overrides", () => {
    it("Declaration overrides with wildcard", () => {
      let testFileInputPath = join(
        __dirname,
        `test_assets/context_barrier.input.css.txt`
      );
      let input = FileUtils.readFileContents(testFileInputPath);
      let expected = input.slice();
      let actual = new Reprinter().getRewrittenContents(
        testFileInputPath,
        input,
        {
          css: {
            sortDeclarations: {
              overrides: ["*", "right", "bottom", "left"],
            },
          },
        }
      );

      expect(actual).to.equal(expected);
    });

    it("Declaration overrides without wildcard", () => {
      let testFileInputPath = join(
        __dirname,
        `test_assets/context_barrier.input.css.txt`
      );
      let input = FileUtils.readFileContents(testFileInputPath);
      let expected = input.slice();
      let actual = new Reprinter().getRewrittenContents(
        testFileInputPath,
        input,
        {
          css: {
            sortDeclarations: {
              overrides: ["top", "right", "bottom"],
            },
          },
        }
      );

      expect(actual).to.equal(expected);
    });
  });

  describe("Overriding parser", () => {
    it("Uses less parser when forced", () => {
      let input = `
    .example {
      position: relative;
      top: 0px;
      bottom: 0px;
    }
    `;
      let expected = `
    .example {
      bottom: 0px;
      position: relative;
      top: 0px;
    }
    `;
      let actual = new Reprinter().getRewrittenContents("example.fake", input, {
        css: {
          parser: "less",
        },
      });

      expect(actual).to.equal(expected);
    });

    it("Uses scss parser when forced", () => {
      let input = `
    .example {
      position: relative;
      top: 0px;
      bottom: 0px;
    }
    `;
      let expected = `
    .example {
      bottom: 0px;
      position: relative;
      top: 0px;
    }
    `;
      let actual = new Reprinter().getRewrittenContents("example.fake", input, {
        css: {
          parser: "scss",
        },
      });

      expect(actual).to.equal(expected);
    });

    it("Throws error if file is not supported", () => {
      let input = `
    .example {
      position: relative;
      top: 0px;
      bottom: 0px;
    }
    `;
      expect(() => {
        new Reprinter().getRewrittenContents("example.fake", input, {
          css: {},
        });
      }).to.throw();
    });

    it("Throws an error if the file cannot be parsed", () => {
      expect(() => {
        new Reprinter().getRewrittenContents(
          "parse_fail.css",
          "This shouldn't parse",
          {}
        );
      }).to.throw();
    });
  });
});
