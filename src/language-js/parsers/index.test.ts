// Parsers
import { parse as parseFlow } from "./flow";
import { parse as parseTypescript } from "./typescript";

describe("language-js/parsers", () => {
  let codeThatFailsParse: string;

  beforeEach(() => {
    codeThatFailsParse = `asdfasdf!@#$`;
  });

  it("Typescript throws error if ast fails to parse", () => {
    expect(() => {
      parseTypescript(codeThatFailsParse);
    }).toThrow();
  });

  it("Flow throws error if ast fails to parse", () => {
    expect(() => {
      parseFlow(codeThatFailsParse);
    }).toThrow();
  });
});
