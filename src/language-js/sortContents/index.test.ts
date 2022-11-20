// Parsers
import { parse as typescriptParse } from "../parsers/typescript/index.js";

// The methods being tested here
import { sortContents } from "./index.js";

// Utilities
import { runTestAssetsTests } from "../../utilities/test-utils.js";
import { getParser } from "../utilities/test-utils.js";

describe("language-js/sortContents", () => {
  runTestAssetsTests(import.meta.url, (inputFilePath: string, inputFileContents: string) => {
    const parser = getParser(inputFilePath);
    const parsed = parser(inputFileContents);
    const actual = sortContents(
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
  });

  it("Overrides", () => {
    const input = `
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
    const expected = `
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
    const parsed = typescriptParse(input);
    const actual = sortContents(
      // @ts-expect-error: Test will already fail if declaration isn't defined
      parsed.body[0].declaration.id.name,
      // @ts-expect-error: Test will already fail if declaration isn't defined
      parsed.body[0].declaration.body.body,
      parsed.comments,
      input,
      {
        isAscending: true,
        overrides: ["constructor", "componentWillUnmount", "componentDidUnmount", "render"],
      }
    );

    expect(actual).toEqual(expected);
  });

  it("Overrides reverse", () => {
    const input = `
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
    const expected = `
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
    const parsed = typescriptParse(input);
    const actual = sortContents(
      // @ts-expect-error: Test will already fail if declaration isn't defined
      parsed.body[0].declaration.id.name,
      // @ts-expect-error: Test will already fail if declaration isn't defined
      parsed.body[0].declaration.body.body,
      parsed.comments,
      input,
      {
        isAscending: false,
        overrides: ["constructor", "componentWillUnmount", "componentDidUnmount", "*"],
      }
    );

    expect(actual).toEqual(expected);
  });
});
