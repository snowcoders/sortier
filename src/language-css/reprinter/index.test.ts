import { join, dirname } from "path";
import { fileURLToPath } from "url";

// The methods being tested here
import { Reprinter } from "./index.js";

// Utilities
import test from "ava";
import { FileUtils } from "../../utilities/file-utils.js";
import { runTestAssestsTests } from "../../utilities/test-utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

test("Default file support > Supports css", (t) => {
  t.true(new Reprinter().isFileSupported("test.css"));
});

test("Default file support > Supports scss", (t) => {
  t.true(new Reprinter().isFileSupported("test.scss"));
});

test("Default file support > Supports less", (t) => {
  t.true(new Reprinter().isFileSupported("test.less"));
});

test("Overriding sortDeclarations' overrides > Declaration overrides with wildcard", (t) => {
  const testFileInputPath = join(
    __dirname,
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

  t.is(actual, expected);
});

test("Overriding sortDeclarations' overrides > Declaration overrides without wildcard", (t) => {
  const testFileInputPath = join(
    __dirname,
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

  t.is(actual, expected);
});

test("Overriding parser > Uses less parser when forced", (t) => {
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
  const actual = new Reprinter().getRewrittenContents("example.fake", input, {
    css: {
      parser: "less",
    },
  });

  t.is(actual, expected);
});

test("Overriding parser > Uses scss parser when forced", (t) => {
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
  const actual = new Reprinter().getRewrittenContents("example.fake", input, {
    css: {
      parser: "scss",
    },
  });

  t.is(actual, expected);
});

test("Overriding parser > Throws error if file is not supported", (t) => {
  const input = `
    .example {
      position: relative;
      top: 0px;
      bottom: 0px;
    }
    `;

  t.throws(() => {
    new Reprinter().getRewrittenContents("example.fake", input, {
      css: {},
    });
  });
});

test("Overriding parser > Throws an error if the file cannot be parsed", (t) => {
  t.throws(() => {
    new Reprinter().getRewrittenContents(
      "parse_fail.css",
      "This shouldn't parse",
      {}
    );
  });
});
