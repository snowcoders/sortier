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
    it("comment", () => {
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

    it("comment, node", () => {
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

    it("comment, comment, node", () => {
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

    it("comment, node, comment, node", () => {
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

    it("comment, node, node", () => {
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

    it("node, comment", () => {
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

    it("node, comment, node", () => {
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
  });
});
