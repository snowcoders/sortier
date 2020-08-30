import { expect } from "chai";
import { join } from "path";

// The methods being tested here
import { Reprinter } from "./index";

// Utilities
import { FileUtils } from "../../utilities/file-utils";
import { runTestAssestsTests } from "../../utilities/test-utils";

describe("language-css/reprinter", () => {
  runTestAssestsTests(
    __dirname,
    (inputFilePath: string, inputFileContents: string) => {
      return new Reprinter().getRewrittenContents(
        inputFilePath,
        inputFileContents,
        {}
      );
    }
  );

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
