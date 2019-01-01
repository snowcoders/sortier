import { expect } from "chai";

import { getContextGroups } from "./sort-utils";

import { parse as flowParse } from "../language-js/parsers/flow";

describe("utilities/sort-utils", () => {
  it("Empty arrays", () => {
    let nodes = [];
    let comments = [];

    getContextGroups(nodes, comments, "");
  });

  describe("Single context group", () => {
    it("comment top", () => {
      let input = `
      // First
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(0);
      expect(result[0].comments).to.have.lengthOf(1);
    });

    it("node", () => {
      let input = `
      log("First");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(1);
      expect(result[0].comments).to.have.lengthOf(0);
    });

    it("comment top, node", () => {
      let input = `
      // First
      log("First");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(1);
      expect(result[0].comments).to.have.lengthOf(0);
    });

    it("comment top, comment top, node", () => {
      let input = `
      // First
      // First - 2
      log("First");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(1);
      expect(result[0].comments).to.have.lengthOf(0);
    });

    it("comment top, node, comment top, node", () => {
      let input = `
      // First
      log("First");
      // Second
      log("Second");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(2);
      expect(result[0].comments).to.have.lengthOf(2);
    });

    it("comment top, node, node", () => {
      let input = `
      // First
      log("First");
      log("Second");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(2);
      expect(result[0].comments).to.have.lengthOf(0);
    });

    it("node, comment top", () => {
      let input = `
      log("First");
      // Second
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(1);
      expect(result[0].comments).to.have.lengthOf(0);
    });

    it("node, comment top, node", () => {
      let input = `
      log("First");
      // Second
      log("Second");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(2);
      expect(result[0].comments).to.have.lengthOf(1);
    });

    it("node, comment right", () => {
      let input = `
      log("First")  // First;
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(1);
      expect(result[0].comments).to.have.lengthOf(1);
    });

    it("comment, node, comment right", () => {
      let input = `
      // First
      log("First")  // First
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(1);
      expect(result[0].comments).to.have.lengthOf(2);
    });

    it("node, comment right, node", () => {
      let input = `
      log("First"); // First
      log("Second");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(2);
      expect(result[0].comments).to.have.lengthOf(1);
    });

    it("node, block comment right, node", () => {
      let input = `
      log("First"); /* First */
      log("Second");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(2);
      expect(result[0].comments).to.have.lengthOf(1);
    });

    it("node, comment right, node, comment right", () => {
      let input = `
      log("First"); // First
      log("Second"); // Second
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(2);
      expect(result[0].comments).to.have.lengthOf(2);
    });

    it("comment, node, comment, node all on one line", () => {
      let input = `
      /* First */ log("First"); /* Second */ log("Second");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(2);
      expect(result[0].comments).to.have.lengthOf(2);
    });

    it("node, comment right, break, comment front, node, comment right", () => {
      let input = `
      log("First"); // First
      /* Second */ log("Second");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(2);
      expect(result[0].comments).to.have.lengthOf(2);
    });
  });

  describe("Multiple context groups", () => {
    it("comment, node, break, comment, node", () => {
      let input = `
      // First
      log("First");

      // Second
      log("Second");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(2);
      expect(result[0].nodes).to.have.lengthOf(1);
      expect(result[0].comments).to.have.lengthOf(0);
      expect(result[1].nodes).to.have.lengthOf(1);
      expect(result[1].comments).to.have.lengthOf(0);
    });

    it("comment, break, node, comment, node", () => {
      let input = `
      // First

      log("First");
      // Second
      log("Second");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(2);
      expect(result[0].comments).to.have.lengthOf(1);
    });

    // comments after a section group aren't included in the next group but also not the previous group as they won't ever be moved.
    // This means that `// First` is the "context" comment for the first group, `// Second` is ignored and the second context group
    // has no comments
    it("comment, node, comment, break, node", () => {
      let input = `
      // First
      log("First");
      // Second

      log("Second");
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(2);
      expect(result[0].nodes).to.have.lengthOf(1);
      expect(result[0].comments).to.have.lengthOf(0);
      expect(result[1].nodes).to.have.lengthOf(1);
      expect(result[1].comments).to.have.lengthOf(0);
    });

    it("comment, break, comment top, comment front, node, comment right", () => {
      let input = `
      // First

      // Second
      /* Second2 */ log("Second"); // Second-3
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(1);
      expect(result[0].nodes).to.have.lengthOf(1);
      expect(result[0].comments).to.have.lengthOf(3);
    });

    it("comment top, comment front, node, comment right, break, comment top, comment front, node, comment right", () => {
      let input = `
      // First
      /* First2 */ log("First"); // First-3

      // Second
      /* Second2 */ log("Second"); // Second-3
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(2);
      expect(result[0].nodes).to.have.lengthOf(1);
      expect(result[0].comments).to.have.lengthOf(3);
      expect(result[1].nodes).to.have.lengthOf(1);
      expect(result[1].comments).to.have.lengthOf(3);
    });

    it("comment top, comment front, node, comment right, break, comment top, comment top, comment front, node, comment right", () => {
      let input = `
      // First
      /* First2 */ log("First"); // First-3

      // Second1
      // Second11
      /* Second2 */ log("Second"); // Second-3
      `;
      let parsed = flowParse(input);
      let result = getContextGroups(parsed.body, parsed.comments, input);

      expect(result).to.have.lengthOf(2);
      expect(result[0].nodes).to.have.lengthOf(1);
      expect(result[0].comments).to.have.lengthOf(3);
      expect(result[1].nodes).to.have.lengthOf(1);
      expect(result[1].comments).to.have.lengthOf(4);
    });
  });
});
