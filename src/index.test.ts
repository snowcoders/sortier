import { formatFile, formatText } from "./index.js";
import { FileUtils } from "./utilities/file-utils.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import test from "ava";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("Runs without crashing", (t) => {
  t.notThrows(() => {
    const thisFile = FileUtils.globbyJoin(__dirname, "index.test.ts");
    formatFile(thisFile, {
      isTestRun: true,
    });
  });
});

test("Runs formatText without crashing", (t) => {
  const result = formatText("ts", "let a = {b: 'b', a: 'a'};", {
    isTestRun: true,
  });
  t.is(result, "let a = {a: 'a', b: 'b'};");
});

test("Validating option overrides > js.sortImportDeclarationSpecifiers.groups = undefined", (t) => {
  const result = formatText("ts", "import { IP, Po } from '@foo';", {
    js: {
      sortImportDeclarationSpecifiers: {
        groups: undefined,
      },
    },
  });
  t.is(result, "import { Po, IP } from '@foo';");
});

test("Validating option overrides > js.sortImportDeclarationSpecifiers.groups = *", (t) => {
  const result = formatText("ts", "import { Po, IP } from '@foo';", {
    js: {
      sortImportDeclarationSpecifiers: {
        groups: ["*"],
      },
    },
  });
  t.is(result, "import { IP, Po } from '@foo';");
});
