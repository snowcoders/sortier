import { expect } from "chai";

// Parsers
import { parse as typescriptParse } from "../parsers/typescript";

// The methods being tested here
import { sortClassContents } from "./index";

// Utilities
import { runTestAssestsTests } from "../../utilities/test-utils";
import { getParser } from "../utilities/test-utils";

describe("language-js/sortClassContents", () => {
  runTestAssestsTests(
    __dirname,
    (inputFilePath: string, inputFileContents: string) => {
      const parser = getParser(inputFilePath);
      let parsed = parser(inputFileContents);
      let actual = sortClassContents(
        parsed.body[0].declaration.id.name,
        parsed.body[0].declaration.body.body,
        parsed.comments,
        inputFileContents,
        {
          isAscending: inputFilePath.indexOf("desc") === -1,
          order: inputFilePath.indexOf("usage") !== -1 ? "usage" : "alpha",
        }
      );
      return actual;
    }
  );

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
