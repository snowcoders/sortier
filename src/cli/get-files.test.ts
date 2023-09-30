import { expect, it } from "@jest/globals";
import { getFiles } from "./get-files.js";

it.each<{
  args: string[];
  expectedFiles: string[];
}>`
  testName                                               | args                                                                | expectedFiles
  ${"returns correct result for glob file match"}        | ${["src/cli/**/get-*"]}                                             | ${["src/cli/get-files.test.[...something].md", "src/cli/get-files.test.ts", "src/cli/get-files.ts"]}
  ${"returns correct result for special character file"} | ${["src/cli/get-files.test.[...something].md"]}                     | ${["src/cli/get-files.test.[...something].md"]}
  ${"returns de-duped list of results"}                  | ${["src/cli/get-files.test.[...something].md", "src/cli/**/get-*"]} | ${["src/cli/get-files.test.[...something].md", "src/cli/get-files.test.ts", "src/cli/get-files.ts"]}
`(`$testName`, ({ args, expectedFiles }) => {
  const matchedFiles = getFiles({
    filepatterns: args,
    ignoreUnknown: false,
  });

  expect(matchedFiles).toEqual(expectedFiles);
});
