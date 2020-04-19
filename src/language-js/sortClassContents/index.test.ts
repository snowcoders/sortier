import { expect } from "chai";
import { readFileSync } from "fs";
import { sync } from "globby";
import { basename } from "path";

// Parsers
import { parse as flowParse } from "../parsers/flow";
import { parse as typescriptParse } from "../parsers/typescript";

// The methods being tested here
import { sortClassContents } from "./index";

// Utilities
import { FileUtils } from "../../utilities/file-utils";
import { StringUtils } from "../../utilities/string-utils";

interface TestInfo {
  inputFilePath: string;
  isAscending: string;
  order: string;
  outputFilePath: string;
  parserType: string;
  testName: string;
}

describe("language-js/sortClassContents", () => {
  let parserTypes: string[];
  let testInfos: TestInfo[];

  parserTypes = [];

  let assetsFolderPath = FileUtils.globbyJoin(
    __dirname,
    "test_assets/*.input.txt"
  );
  testInfos = sync(assetsFolderPath).map((filePath) => {
    let segments = basename(filePath).split(".");

    if (parserTypes.indexOf(segments[0]) === -1) {
      parserTypes.push(segments[0]);
    }

    let order = segments[1];

    let isAscending = segments[2];

    let cleanedTestName = StringUtils.sentenceCase(
      segments[3].replace(/_/g, " ")
    );

    return {
      inputFilePath: filePath,
      isAscending: isAscending,
      order: order,
      outputFilePath: filePath.replace(".input.txt", ".output.txt"),
      parserType: segments[0],
      testName: cleanedTestName,
    };
  });

  parserTypes.forEach((fileType) => {
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

      testInfos.forEach((testInfo) => {
        if (testInfo.parserType == fileType) {
          it(`${testInfo.order} - ${testInfo.isAscending} - ${testInfo.testName}`, () => {
            let input = readFileSync(testInfo.inputFilePath, "utf8");
            let expected = readFileSync(testInfo.outputFilePath, "utf8");
            let parsed = parser(input);
            let actual = sortClassContents(
              parsed.body[0].declaration.id.name,
              parsed.body[0].declaration.body.body,
              parsed.comments,
              input,
              {
                isAscending: testInfo.isAscending === "asc",
                order: testInfo.order === "usage" ? "usage" : "alpha",
              }
            );

            expect(actual).to.equal(expected);
          });
        }
      });
    });
  });

  it("Overrides", () => {
    let input = `
    export class Clock {
      constructor(props) {
        super(props);
        this.state = {date: new Date()};
      }
    
      someHelperMethod() {
        return <h2>It is {this.state.date.toLocaleTimeString()}.</h2>;
      }
    
      componentWillUnmount() {
    
      }
    
      componentDidUnmount() {
    
      }
    
      render() {
        return (
          <div>
            <h1>Hello, world!</h1>
            {this.someHelperMethod()}
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
            {this.someHelperMethod()}
          </div>
        );
      }
    
      someHelperMethod() {
        return <h2>It is {this.state.date.toLocaleTimeString()}.</h2>;
      }
    }`;
    let parsed = typescriptParse(input);
    let actual = sortClassContents(
      parsed.body[0].declaration.id.name,
      parsed.body[0].declaration.body.body,
      parsed.comments,
      input,
      {
        isAscending: true,
        overrides: [
          "constructor",
          "componentWillUnmount",
          "componentDidUnmount",
          "render",
        ],
      }
    );

    expect(actual).to.equal(expected);
  });

  it("Overrides reverse", () => {
    let input = `
    export class Clock {
      constructor(props) {
        super(props);
        this.state = {date: new Date()};
      }
    
      someHelperMethod() {
        return <h2>It is {this.state.date.toLocaleTimeString()}.</h2>;
      }
    
      componentWillUnmount() {
    
      }
    
      componentDidUnmount() {
    
      }
    
      render() {
        return (
          <div>
            <h1>Hello, world!</h1>
            {this.someHelperMethod()}
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
    
      someHelperMethod() {
        return <h2>It is {this.state.date.toLocaleTimeString()}.</h2>;
      }
    
      render() {
        return (
          <div>
            <h1>Hello, world!</h1>
            {this.someHelperMethod()}
          </div>
        );
      }
    }`;
    let parsed = typescriptParse(input);
    let actual = sortClassContents(
      parsed.body[0].declaration.id.name,
      parsed.body[0].declaration.body.body,
      parsed.comments,
      input,
      {
        isAscending: false,
        overrides: [
          "constructor",
          "componentWillUnmount",
          "componentDidUnmount",
          "*",
        ],
      }
    );

    expect(actual).to.equal(expected);
  });
});
