import { BaseNode, Comment, compare, getContextGroups, reorderValues } from "./sort-utils.js";

import { parse } from "../language-js/parsers/typescript/index.js";

function sortImportDeclarations(input: string) {
  const ast = parse(input);
  const astBodySorted = ast.body.slice().sort((a, b) => {
    // @ts-expect-error We're just assuming everything is an import here
    return compare(a.source.value, b.source.value);
  });
  return reorderValues(input, ast.comments, ast.body, astBodySorted);
}

describe("utilities/sort-utils", () => {
  describe("getContextGroups", () => {
    it("Empty arrays", () => {
      const nodes: Array<BaseNode> = [];
      const comments: Array<Comment> = [];

      getContextGroups(nodes, comments, "");
    });

    it("Spaces within nodes but not around", () => {
      const input = `
    {
      console.log("a");
      
      console.log("b");
    }
    {
      console.log("c");
      
      console.log("d");
    }
    `;
      const parsed = parse(input);
      const result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).toHaveLength(1);
      expect(result[0].nodes).toHaveLength(2);
      expect(result[0].comments).toHaveLength(0);
    });

    describe("Comments - Single context group", () => {
      it("comment top", () => {
        const input = `
      // First
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(0);
        expect(result[0].comments).toHaveLength(1);
      });

      it("node", () => {
        const input = `
      log("First");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(1);
        expect(result[0].comments).toHaveLength(0);
      });

      it("comment top, node", () => {
        const input = `
      // First
      log("First");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(1);
        expect(result[0].comments).toHaveLength(0);
      });

      it("comment top, comment top, node", () => {
        const input = `
      // First
      // First - 2
      log("First");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(1);
        expect(result[0].comments).toHaveLength(0);
      });

      it("comment top, node, comment top, node", () => {
        const input = `
      // First
      log("First");
      // Second
      log("Second");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(2);
        expect(result[0].comments).toHaveLength(2);
      });

      it("comment top, node, node", () => {
        const input = `
      // First
      log("First");
      log("Second");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(2);
        expect(result[0].comments).toHaveLength(0);
      });

      it("node, comment top", () => {
        const input = `
      log("First");
      // Second
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(1);
        expect(result[0].comments).toHaveLength(0);
      });

      it("node, comment top, node", () => {
        const input = `
      log("First");
      // Second
      log("Second");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(2);
        expect(result[0].comments).toHaveLength(1);
      });

      it("node, comment right", () => {
        const input = `
      log("First")  // First;
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(1);
        expect(result[0].comments).toHaveLength(1);
      });

      it("comment, node, comment right", () => {
        const input = `
      // First
      log("First")  // First
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(1);
        expect(result[0].comments).toHaveLength(2);
      });

      it("node, comment right, node", () => {
        const input = `
      log("First"); // First
      log("Second");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(2);
        expect(result[0].comments).toHaveLength(1);
      });

      it("node, block comment right, node", () => {
        const input = `
      log("First"); /* First */
      log("Second");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(2);
        expect(result[0].comments).toHaveLength(1);
      });

      it("node, comment right, node, comment right", () => {
        const input = `
      log("First"); // First
      log("Second"); // Second
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(2);
        expect(result[0].comments).toHaveLength(2);
      });

      it("comment, node, comment, node all on one line", () => {
        const input = `
      /* First */ log("First"); /* Second */ log("Second");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(2);
        expect(result[0].comments).toHaveLength(2);
      });

      it("node, comment right, break, comment front, node, comment right", () => {
        const input = `
      log("First"); // First
      /* Second */ log("Second");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(2);
        expect(result[0].comments).toHaveLength(2);
      });
    });

    describe("Comments - Multiple context groups", () => {
      it("comment, node, break, comment, node", () => {
        const input = `
      // First
      log("First");

      // Second
      log("Second");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(2);
        expect(result[0].nodes).toHaveLength(1);
        expect(result[0].comments).toHaveLength(0);
        expect(result[1].nodes).toHaveLength(1);
        expect(result[1].comments).toHaveLength(0);
      });

      it("comment, break, node, comment, node", () => {
        const input = `
      // First

      log("First");
      // Second
      log("Second");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(2);
        expect(result[0].comments).toHaveLength(1);
      });

      // comments after a section group aren't included in the next group but also not the previous group as they won't ever be moved.
      // This means that `// First` is the "context" comment for the first group, `// Second` is ignored and the second context group
      // has no comments
      it("comment, node, comment, break, node", () => {
        const input = `
      // First
      log("First");
      // Second

      log("Second");
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(2);
        expect(result[0].nodes).toHaveLength(1);
        expect(result[0].comments).toHaveLength(0);
        expect(result[1].nodes).toHaveLength(1);
        expect(result[1].comments).toHaveLength(0);
      });

      it("comment, break, comment top, comment front, node, comment right", () => {
        const input = `
      // First

      // Second
      /* Second2 */ log("Second"); // Second-3
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(1);
        expect(result[0].nodes).toHaveLength(1);
        expect(result[0].comments).toHaveLength(3);
      });

      it("comment top, comment front, node, comment right, break, comment top, comment front, node, comment right", () => {
        const input = `
      // First
      /* First2 */ log("First"); // First-3

      // Second
      /* Second2 */ log("Second"); // Second-3
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(2);
        expect(result[0].nodes).toHaveLength(1);
        expect(result[0].comments).toHaveLength(3);
        expect(result[1].nodes).toHaveLength(1);
        expect(result[1].comments).toHaveLength(3);
      });

      it("comment top, comment front, node, comment right, break, comment top, comment top, comment front, node, comment right", () => {
        const input = `
      // First
      /* First2 */ log("First"); // First-3

      // Second1
      // Second11
      /* Second2 */ log("Second"); // Second-3
      `;
        const parsed = parse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).toHaveLength(2);
        expect(result[0].nodes).toHaveLength(1);
        expect(result[0].comments).toHaveLength(3);
        expect(result[1].nodes).toHaveLength(1);
        expect(result[1].comments).toHaveLength(4);
      });
    });
  });

  describe("reorderValues", () => {
    it("reorders values", () => {
      const input = ["import c from 'c';", "import b from 'b';", "import a from 'a';"].join("\n");
      const expectedOutput = ["import a from 'a';", "import b from 'b';", "import c from 'c';"].join("\n");

      const ast = parse(input);
      const astBodySorted = ast.body.slice().sort((a, b) => {
        // @ts-expect-error We're just assuming everything is an import here
        return compare(a.source.value, b.source.value);
      });
      const result = reorderValues(input, ast.comments, ast.body, astBodySorted);

      expect(result).toEqual(expectedOutput);
    });

    describe("single inline comment", () => {
      it("preceding first line", () => {
        const input = ["// Comment 1", "import c from 'c';", "import a from 'a';", "import b from 'b';"].join("\n");
        const expectedOutput = ["import a from 'a';", "import b from 'b';", "// Comment 1", "import c from 'c';"].join(
          "\n"
        );

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("preceding a line", () => {
        const input = ["import c from 'c';", "import a from 'a';", "// Comment 1", "import b from 'b';"].join("\n");
        const expectedOutput = ["import a from 'a';", "// Comment 1", "import b from 'b';", "import c from 'c';"].join(
          "\n"
        );

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("after a statement", () => {
        const input = ["import c from 'c';", "import a from 'a';", "import b from 'b'; // Comment 1"].join("\n");
        const expectedOutput = ["import a from 'a';", "import b from 'b'; // Comment 1", "import c from 'c';"].join(
          "\n"
        );

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("succeeding last line", () => {
        const input = ["import c from 'c';", "import a from 'a';", "import b from 'b';", "// Comment 1"].join("\n");
        const expectedOutput = ["import a from 'a';", "import b from 'b';", "import c from 'c';", "// Comment 1"].join(
          "\n"
        );

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });
    });

    describe("multiple inline comments", () => {
      it("preceding first line", () => {
        const input = [
          "// Comment 1",
          "// Comment 2",
          "import c from 'c';",
          "import a from 'a';",
          "import b from 'b';",
        ].join("\n");
        const expectedOutput = [
          "import a from 'a';",
          "import b from 'b';",
          "// Comment 1",
          "// Comment 2",
          "import c from 'c';",
        ].join("\n");

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("preceding a line", () => {
        const input = [
          "import c from 'c';",
          "import a from 'a';",
          "// Comment 1",
          "// Comment 2",
          "import b from 'b';",
        ].join("\n");
        const expectedOutput = [
          "import a from 'a';",
          "// Comment 1",
          "// Comment 2",
          "import b from 'b';",
          "import c from 'c';",
        ].join("\n");

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("succeeding last line", () => {
        const input = [
          "import c from 'c';",
          "import a from 'a';",
          "import b from 'b';",
          "// Comment 1",
          "// Comment 2",
        ].join("\n");
        const expectedOutput = [
          "import a from 'a';",
          "import b from 'b';",
          "import c from 'c';",
          "// Comment 1",
          "// Comment 2",
        ].join("\n");

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });
    });

    describe("single block comment", () => {
      it("preceding first line", () => {
        const input = ["/* Comment 1 */", "import c from 'c';", "import a from 'a';", "import b from 'b';"].join("\n");
        const expectedOutput = [
          "import a from 'a';",
          "import b from 'b';",
          "/* Comment 1 */",
          "import c from 'c';",
        ].join("\n");

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("preceding a line", () => {
        const input = ["import c from 'c';", "import a from 'a';", "/* Comment 1 */", "import b from 'b';"].join("\n");
        const expectedOutput = [
          "import a from 'a';",
          "/* Comment 1 */",
          "import b from 'b';",
          "import c from 'c';",
        ].join("\n");

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("before a statement", () => {
        const input = ["import c from 'c';", "import a from 'a';", "/* Comment 1 */ import b from 'b';"].join("\n");
        const expectedOutput = ["import a from 'a';", "/* Comment 1 */ import b from 'b';", "import c from 'c';"].join(
          "\n"
        );

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("after a statement", () => {
        const input = ["import c from 'c';", "import a from 'a';", "import b from 'b'; /* Comment 1 */"].join("\n");
        const expectedOutput = ["import a from 'a';", "import b from 'b'; /* Comment 1 */", "import c from 'c';"].join(
          "\n"
        );

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("succeeding last line", () => {
        const input = ["import c from 'c';", "import a from 'a';", "import b from 'b';", "/* Comment 1 */"].join("\n");
        const expectedOutput = [
          "import a from 'a';",
          "import b from 'b';",
          "import c from 'c';",
          "/* Comment 1 */",
        ].join("\n");

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });
    });

    describe("multiple block comments", () => {
      it("preceding first line", () => {
        const input = [
          "/* Comment 1 */",
          "/* Comment 2 */",
          "import c from 'c';",
          "import a from 'a';",
          "import b from 'b';",
        ].join("\n");
        const expectedOutput = [
          "import a from 'a';",
          "import b from 'b';",
          "/* Comment 1 */",
          "/* Comment 2 */",
          "import c from 'c';",
        ].join("\n");

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("preceding a line", () => {
        const input = [
          "import c from 'c';",
          "import a from 'a';",
          "/* Comment 1 */",
          "/* Comment 2 */",
          "import b from 'b';",
        ].join("\n");
        const expectedOutput = [
          "import a from 'a';",
          "/* Comment 1 */",
          "/* Comment 2 */",
          "import b from 'b';",
          "import c from 'c';",
        ].join("\n");

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("before a statement", () => {
        const input = [
          "import c from 'c';",
          "import a from 'a';",
          "/* Comment 1 */ /* Comment 2 */ import b from 'b';",
        ].join("\n");
        const expectedOutput = [
          "import a from 'a';",
          "/* Comment 1 */ /* Comment 2 */ import b from 'b';",
          "import c from 'c';",
        ].join("\n");

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      xit("after a statement", () => {
        const input = [
          "import c from 'c';",
          "import a from 'a';",
          "import b from 'b'; /* Comment 1 */ /* Comment 2 */",
        ].join("\n");
        const expectedOutput = [
          "import a from 'a';",
          "import b from 'b'; /* Comment 1 */ /* Comment 2 */",
          "import c from 'c';",
        ].join("\n");

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });

      it("succeeding last line", () => {
        const input = [
          "import c from 'c';",
          "import a from 'a';",
          "import b from 'b';",
          "/* Comment 1 */",
          "/* Comment 2 */",
        ].join("\n");
        const expectedOutput = [
          "import a from 'a';",
          "import b from 'b';",
          "import c from 'c';",
          "/* Comment 1 */",
          "/* Comment 2 */",
        ].join("\n");

        const result = sortImportDeclarations(input);
        expect(result).toEqual(expectedOutput);
      });
    });
  });
});
