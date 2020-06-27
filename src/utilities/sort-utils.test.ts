import { expect } from "chai";

import { getContextGroups } from "./sort-utils";

import { parse as flowParse } from "../language-js/parsers/flow";

describe("utilities/sort-utils", () => {
  describe("getContextGroups", () => {
    it("Empty arrays", () => {
      const nodes = [];
      const comments = [];

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
      const parsed = flowParse(input);
      const result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(2);
      expect(result[0].comments).to.have.lengthOf(0);
    });

    describe("Comments - Single context group", () => {
      it("comment top", () => {
        const input = `
      // First
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(0);
        expect(result[0].comments).to.have.lengthOf(1);
      });

      it("node", () => {
        const input = `
      log("First");
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(1);
        expect(result[0].comments).to.have.lengthOf(0);
      });

      it("comment top, node", () => {
        const input = `
      // First
      log("First");
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(1);
        expect(result[0].comments).to.have.lengthOf(0);
      });

      it("comment top, comment top, node", () => {
        const input = `
      // First
      // First - 2
      log("First");
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(1);
        expect(result[0].comments).to.have.lengthOf(0);
      });

      it("comment top, node, comment top, node", () => {
        const input = `
      // First
      log("First");
      // Second
      log("Second");
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(2);
        expect(result[0].comments).to.have.lengthOf(2);
      });

      it("comment top, node, node", () => {
        const input = `
      // First
      log("First");
      log("Second");
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(2);
        expect(result[0].comments).to.have.lengthOf(0);
      });

      it("node, comment top", () => {
        const input = `
      log("First");
      // Second
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(1);
        expect(result[0].comments).to.have.lengthOf(0);
      });

      it("node, comment top, node", () => {
        const input = `
      log("First");
      // Second
      log("Second");
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(2);
        expect(result[0].comments).to.have.lengthOf(1);
      });

      it("node, comment right", () => {
        const input = `
      log("First")  // First;
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(1);
        expect(result[0].comments).to.have.lengthOf(1);
      });

      it("comment, node, comment right", () => {
        const input = `
      // First
      log("First")  // First
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(1);
        expect(result[0].comments).to.have.lengthOf(2);
      });

      it("node, comment right, node", () => {
        const input = `
      log("First"); // First
      log("Second");
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(2);
        expect(result[0].comments).to.have.lengthOf(1);
      });

      it("node, block comment right, node", () => {
        const input = `
      log("First"); /* First */
      log("Second");
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(2);
        expect(result[0].comments).to.have.lengthOf(1);
      });

      it("node, comment right, node, comment right", () => {
        const input = `
      log("First"); // First
      log("Second"); // Second
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(2);
        expect(result[0].comments).to.have.lengthOf(2);
      });

      it("comment, node, comment, node all on one line", () => {
        const input = `
      /* First */ log("First"); /* Second */ log("Second");
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(2);
        expect(result[0].comments).to.have.lengthOf(2);
      });

      it("node, comment right, break, comment front, node, comment right", () => {
        const input = `
      log("First"); // First
      /* Second */ log("Second");
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(2);
        expect(result[0].comments).to.have.lengthOf(2);
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
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(2);
        expect(result[0].nodes).to.have.lengthOf(1);
        expect(result[0].comments).to.have.lengthOf(0);
        expect(result[1].nodes).to.have.lengthOf(1);
        expect(result[1].comments).to.have.lengthOf(0);
      });

      it("comment, break, node, comment, node", () => {
        const input = `
      // First

      log("First");
      // Second
      log("Second");
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(2);
        expect(result[0].comments).to.have.lengthOf(1);
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
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(2);
        expect(result[0].nodes).to.have.lengthOf(1);
        expect(result[0].comments).to.have.lengthOf(0);
        expect(result[1].nodes).to.have.lengthOf(1);
        expect(result[1].comments).to.have.lengthOf(0);
      });

      it("comment, break, comment top, comment front, node, comment right", () => {
        const input = `
      // First

      // Second
      /* Second2 */ log("Second"); // Second-3
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(1);
        expect(result[0].nodes).to.have.lengthOf(1);
        expect(result[0].comments).to.have.lengthOf(3);
      });

      it("comment top, comment front, node, comment right, break, comment top, comment front, node, comment right", () => {
        const input = `
      // First
      /* First2 */ log("First"); // First-3

      // Second
      /* Second2 */ log("Second"); // Second-3
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(2);
        expect(result[0].nodes).to.have.lengthOf(1);
        expect(result[0].comments).to.have.lengthOf(3);
        expect(result[1].nodes).to.have.lengthOf(1);
        expect(result[1].comments).to.have.lengthOf(3);
      });

      it("comment top, comment front, node, comment right, break, comment top, comment top, comment front, node, comment right", () => {
        const input = `
      // First
      /* First2 */ log("First"); // First-3

      // Second1
      // Second11
      /* Second2 */ log("Second"); // Second-3
      `;
        const parsed = flowParse(input);
        const result = getContextGroups(parsed.body, parsed.comments, input);

        expect(result).to.have.lengthOf(2);
        expect(result[0].nodes).to.have.lengthOf(1);
        expect(result[0].comments).to.have.lengthOf(3);
        expect(result[1].nodes).to.have.lengthOf(1);
        expect(result[1].comments).to.have.lengthOf(4);
      });
    });
  });
});
