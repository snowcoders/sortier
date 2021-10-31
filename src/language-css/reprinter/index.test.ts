import { dirname, join } from "path";

// The methods being tested here
import { Reprinter } from "./index.js";

// Utilities
import { FileUtils } from "../../utilities/file-utils.js";
import {
  getFolderPathFromFileUrl,
  runTestAssetsTests,
} from "../../utilities/test-utils.js";

const currentFolderPath = getFolderPathFromFileUrl(import.meta.url);

describe("language-css/reprinter", () => {
  runTestAssetsTests(
    import.meta.url,
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
      const testFileInputPath = join(
        currentFolderPath,
        `test_assets/context_barrier.input.css.txt`
      );
      const input = FileUtils.readFileContents(testFileInputPath);
      const expected = input.slice();
      const actual = new Reprinter().getRewrittenContents(
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

      expect(actual).toEqual(expected);
    });

    it("Declaration overrides without wildcard", () => {
      const testFileInputPath = join(
        currentFolderPath,
        `test_assets/context_barrier.input.css.txt`
      );
      const input = FileUtils.readFileContents(testFileInputPath);
      const expected = input.slice();
      const actual = new Reprinter().getRewrittenContents(
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

      expect(actual).toEqual(expected);
    });
  });

  describe("Overriding parser", () => {
    it("Uses less parser when forced", () => {
      const input = `
    .example {
      position: relative;
      top: 0px;
      bottom: 0px;
    }
    `;
      const expected = `
    .example {
      bottom: 0px;
      position: relative;
      top: 0px;
    }
    `;
      const actual = new Reprinter().getRewrittenContents(
        "example.fake",
        input,
        {
          css: {
            parser: "less",
          },
        }
      );

      expect(actual).toEqual(expected);
    });

    it("Uses scss parser when forced", () => {
      const input = `
    .example {
      position: relative;
      top: 0px;
      bottom: 0px;
    }
    `;
      const expected = `
    .example {
      bottom: 0px;
      position: relative;
      top: 0px;
    }
    `;
      const actual = new Reprinter().getRewrittenContents(
        "example.fake",
        input,
        {
          css: {
            parser: "scss",
          },
        }
      );

      expect(actual).toEqual(expected);
    });

    it("Throws error if file is not supported", () => {
      const input = `
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
      }).toThrow();
    });

    it("Throws an error if the file cannot be parsed", () => {
      expect(() => {
        new Reprinter().getRewrittenContents(
          "parse_fail.css",
          "This shouldn't parse",
          {}
        );
      }).toThrow();
    });
  });
});
