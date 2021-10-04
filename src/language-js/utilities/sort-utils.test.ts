import { TypeAnnotationOption, getObjectTypeRanks } from "./sort-utils.js";
import test from "ava";

test("getObjectTypeRanks > Returns 0 for everything when passed an empty array", (t) => {
  const result = getObjectTypeRanks([]);
  t.is(result.everything, 0);
  t.is(result.function, 0);
  t.is(result.null, 0);
  t.is(result.object, 0);
  t.is(result.undefined, 0);
});

test("getObjectTypeRanks > Returns defaults for undefined", (t) => {
  const result = getObjectTypeRanks(undefined);
  t.is(result.undefined, 0);
  t.is(result.null, 1);
  t.is(result.everything, 2);
  t.is(result.object, 2);
  t.is(result.function, 3);
});

test("getObjectTypeRanks > Returns the exact same value when passed the same array", (t) => {
  const input: Array<TypeAnnotationOption> = [];
  const result = getObjectTypeRanks(input);
  const result2 = getObjectTypeRanks(input);
  t.is(result, result2);
});
