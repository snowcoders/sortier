import { join } from "path";
import { format } from "./index";

it("Runs without crashing", () => {
  let thisFile = join(__dirname, "index.test.ts");
  format(thisFile, {
    isTestRun: true
  });
});
