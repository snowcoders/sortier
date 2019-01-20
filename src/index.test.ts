import { join } from "path";
import { formatFile, formatText } from "./index";

it("Runs without crashing", () => {
  let thisFile = join(__dirname, "index.test.ts");
  formatFile(thisFile, {
    isTestRun: true
  });
});

it("Runs formatText without crashing", () => {
  formatText("ts", "", {
    isTestRun: true
  });
});
