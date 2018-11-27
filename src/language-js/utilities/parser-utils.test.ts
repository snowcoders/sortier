import { expect } from "chai";
import { createError, includeShebang } from "./parser-utils";

describe("language-js/parser-utils", () => {
  describe("createError", () => {
    it("Constructors an error", () => {
      let error = createError("message", { start: { column: 3, line: 2 } });
      expect(error).to.exist;
    });
  });

  describe("includeShebang", () => {
    it("Does not modify comments if shebang exists", () => {
      let array = [];
      let ast = { comments: array };
      includeShebang("#!message", ast);
      expect(ast.comments === array).to.be.true;
    });
  });
});
