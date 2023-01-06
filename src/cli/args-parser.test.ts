import { it, expect } from "@jest/globals";
import { parseArgs } from "./args-parser.js";

it.each<{
  args: string[];
  expectedFilePatterns: string[];
  expectedIgnoreUnknown: boolean;
}>`
  testName                                                        | args                                                           | expectedFilePatterns                       | expectedIgnoreUnknown
  ${"parses a single file pattern"}                               | ${["*sortier*"]}                                               | ${["*sortier*"]}                           | ${false}
  ${"parses multiple file pattern"}                               | ${["*sortier*", "*prettier*", "*eslint*"]}                     | ${["*sortier*", "*prettier*", "*eslint*"]} | ${false}
  ${"parses a single file pattern with ignore unknown at front"}  | ${["--ignore-unknown", "*sortier*"]}                           | ${["*sortier*"]}                           | ${true}
  ${"parses multiple file pattern with ignore unknown at front"}  | ${["--ignore-unknown", "*sortier*", "*prettier*", "*eslint*"]} | ${["*sortier*", "*prettier*", "*eslint*"]} | ${true}
  ${"parses a single file pattern with ignore unknown at back"}   | ${["*sortier*", "--ignore-unknown"]}                           | ${["*sortier*"]}                           | ${true}
  ${"parses multiple file pattern with ignore unknown at back"}   | ${["*sortier*", "*prettier*", "*eslint*", "--ignore-unknown"]} | ${["*sortier*", "*prettier*", "*eslint*"]} | ${true}
  ${"parses multiple file pattern with ignore unknown at middle"} | ${["*sortier*", "--ignore-unknown", "*prettier*", "*eslint*"]} | ${["*sortier*", "*prettier*", "*eslint*"]} | ${true}
`(`$testName`, ({ args, expectedFilePatterns, expectedIgnoreUnknown }) => {
  const { filepatterns, ignoreUnknown } = parseArgs(args);

  expect(filepatterns).toEqual(expectedFilePatterns);
  expect(ignoreUnknown).toEqual(expectedIgnoreUnknown);
});
