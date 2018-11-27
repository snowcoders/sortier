import { expect } from "chai";

// Parsers
import { parse as parseFlow } from "./flow";
import { parse as parseTypescript } from "./typescript";

describe("language-js/parsers", () => {
  let codeThatFailsParse;

  beforeEach(() => {
    codeThatFailsParse = `asdfasdf!@#$`;
  });

  it("Typescript throws error if ast fails to parse", () => {
    expect(() => {
      parseTypescript(codeThatFailsParse);
    }).to.throw();
  });

  it("Flow throws error if ast fails to parse", () => {
    expect(() => {
      parseFlow(codeThatFailsParse);
    }).to.throw();
  });
});
