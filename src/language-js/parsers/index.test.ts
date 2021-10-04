// Parsers
import { parse as parseFlow } from "./flow/index.js";
import { parse as parseTypescript } from "./typescript/index.js";
import test from "ava";

const codeThatFailsParse = `asdfasdf!@#$`;

test("Typescript throws error if ast fails to parse", (t) => {
  t.throws(() => {
    parseTypescript(codeThatFailsParse);
  });
});

test("Flow throws error if ast fails to parse", (t) => {
  t.throws(() => {
    parseFlow(codeThatFailsParse);
  });
});
