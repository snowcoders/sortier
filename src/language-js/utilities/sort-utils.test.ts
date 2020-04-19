import { expect } from "chai";
import { getObjectTypeRanks } from "./sort-utils";

describe("language-js/utilities/sort-utils", () => {
  describe("getObjectTypeRanks", () => {
    it("Returns 0 for everything when passed an empty array", () => {
      let result = getObjectTypeRanks([]);
      expect(result.everything).to.equal(0);
      expect(result.function).to.equal(0);
      expect(result.null).to.equal(0);
      expect(result.object).to.equal(0);
      expect(result.undefined).to.equal(0);
    });

    it("Returns defaults for undefined", () => {
      let result = getObjectTypeRanks(undefined);
      expect(result.undefined).to.equal(0);
      expect(result.null).to.equal(1);
      expect(result.everything).to.equal(2);
      expect(result.object).to.equal(2);
      expect(result.function).to.equal(3);
    });

    it("Returns the exact same value when passed the same array", () => {
      let input = [];
      let result = getObjectTypeRanks(input);
      let result2 = getObjectTypeRanks(input);
      expect(result).to.equal(result2);
    });
  });
});
