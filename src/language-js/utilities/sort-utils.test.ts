import { TypeAnnotationOption, getObjectTypeRanks } from "./sort-utils.js";

describe("language-js/utilities/sort-utils", () => {
  describe("getObjectTypeRanks", () => {
    it("Returns 0 for everything when passed an empty array", () => {
      const result = getObjectTypeRanks([]);
      expect(result.everything).toEqual(0);
      expect(result.function).toEqual(0);
      expect(result.null).toEqual(0);
      expect(result.object).toEqual(0);
      expect(result.undefined).toEqual(0);
    });

    it("Returns defaults for undefined", () => {
      const result = getObjectTypeRanks(undefined);
      expect(result.undefined).toEqual(0);
      expect(result.null).toEqual(1);
      expect(result.everything).toEqual(2);
      expect(result.object).toEqual(2);
      expect(result.function).toEqual(3);
    });

    it("Returns the exact same value when passed the same array", () => {
      const input: Array<TypeAnnotationOption> = [];
      const result = getObjectTypeRanks(input);
      const result2 = getObjectTypeRanks(input);
      expect(result).toEqual(result2);
    });
  });
});
