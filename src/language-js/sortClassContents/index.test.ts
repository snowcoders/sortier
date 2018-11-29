import { expect } from "chai";
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename, join } from "path";

// Parsers
import { parse as flowParse } from "../parsers/flow";
import { parse as typescriptParse } from "../parsers/typescript";

// The methods being tested here
import { sortClassContents } from "./index";

// Utilities
import { StringUtils } from "../../utilities/string-utils";

interface TestInfo {
  inputFilePath: string;
  outputFilePath: string;
  parserType: string;
  testName: string;
}

describe("language-js/sortClassContents", () => {
  let parserTypes: string[];
  let testInfos: TestInfo[];

  parserTypes = [];

  let assetsFolderPath = join(__dirname, "test_assets/*.input.txt");
  testInfos = sync(assetsFolderPath).map(filePath => {
    let segments = basename(filePath).split(".");

    if (parserTypes.indexOf(segments[0]) === -1) {
      parserTypes.push(segments[0]);
    }

    let cleanedTestName = StringUtils.sentenceCase(
      segments[1].replace(/_/g, " ")
    );

    return {
      inputFilePath: filePath,
      outputFilePath: filePath.replace(".input.txt", ".output.txt"),
      parserType: segments[0],
      testName: cleanedTestName
    };
  });

  parserTypes.forEach(fileType => {
    describe(fileType, () => {
      let parser;
      switch (fileType) {
        case "es6":
        case "flow":
          parser = flowParse;
          break;
        case "typescript":
          parser = typescriptParse;
          break;
        default:
          throw new Error(
            "Unknown parser passed - " +
              fileType +
              ". Expected 'flow', 'typescript' or 'es6'."
          );
      }

      testInfos.forEach(testInfo => {
        if (testInfo.parserType == fileType) {
          it(testInfo.testName, () => {
            let input = readFileSync(testInfo.inputFilePath, "utf8");
            let expected = readFileSync(testInfo.outputFilePath, "utf8");
            let parsed = parser(input);
            let actual = sortClassContents(
              parsed.body[0].declaration.body.body,
              parsed.comments,
              input,
              {}
            );

            expect(actual).to.equal(expected);
          });
        }
      });
    });
  });

  it("Reverse alphabetical", () => {
    let input = `
    export class Example {
      a = () => {
        console.log('a');
      }
      ba = () => {
    
      }
    }`;
    let expected = `
    export class Example {
      ba = () => {
    
      }
      a = () => {
        console.log('a');
      }
    }`;
    let parsed = typescriptParse(input);
    let actual = sortClassContents(
      parsed.body[0].declaration.body.body,
      parsed.comments,
      input,
      {
        isAscending: false
      }
    );

    expect(actual).to.equal(expected);
  });

  it("Usage", () => {
    let input = `
    export class Example {
      run() {
        try {
          this.try();
        } catch(e) {
          this.catch();
        } finally {
          this.finally();
        }
      }

      try = () => {
        console.log("try");
      }

      catch = () => {
        console.log("catch");
      }

      finally() {
        console.log("finally");
      }
    }`;
    let expected = input;
    let parsed = typescriptParse(input);
    let actual = sortClassContents(
      parsed.body[0].declaration.body.body,
      parsed.comments,
      input,
      {
        order: "usage"
      }
    );

    expect(actual).to.equal(expected);
  });

  it("Usage reverse", () => {
    let input = `
    export class Example {
      finally() {
        console.log("finally");
      }

      catch = () => {
        console.log("catch");
      }

      try = () => {
        console.log("try");
      }

      run() {
        try {
          this.try();
        } catch(e) {
          this.catch();
        } finally {
          this.finally();
        }
      }
    }`;
    let expected = input;
    let parsed = typescriptParse(input);
    let actual = sortClassContents(
      parsed.body[0].declaration.body.body,
      parsed.comments,
      input,
      {
        isAscending: false,
        order: "usage"
      }
    );

    expect(actual).to.equal(expected);
  });

  it("Overrides", () => {
    let input = `
    export class Clock {
      constructor(props) {
        super(props);
        this.state = {date: new Date()};
      }
    
      componentWillUnmount() {
    
      }
    
      componentDidUnmount() {
    
      }
    
      render() {
        return (
          <div>
            <h1>Hello, world!</h1>
            <h2>It is {this.state.date.toLocaleTimeString()}.</h2>
          </div>
        );
      }
    }`;
    let expected = `
    export class Clock {
      constructor(props) {
        super(props);
        this.state = {date: new Date()};
      }
    
      componentWillUnmount() {
    
      }
    
      componentDidUnmount() {
    
      }
    
      render() {
        return (
          <div>
            <h1>Hello, world!</h1>
            <h2>It is {this.state.date.toLocaleTimeString()}.</h2>
          </div>
        );
      }
    }`;
    let parsed = typescriptParse(input);
    let actual = sortClassContents(
      parsed.body[0].declaration.body.body,
      parsed.comments,
      input,
      {
        isAscending: true,
        overrides: [
          "constructor",
          "componentWillUnmount",
          "componentDidUnmount",
          "render"
        ]
      }
    );

    expect(actual).to.equal(expected);
  });
});
