import { expect } from "chai";
import { join } from "path";
import { formatFile, formatText } from "./index";

it("Runs without crashing", () => {
  let thisFile = join(__dirname, "index.test.ts");
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
