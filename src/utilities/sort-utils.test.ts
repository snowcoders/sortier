import { BaseNode, Comment, getContextGroups } from "./sort-utils.js";
import test from "ava";

import { parse as flowParse } from "../language-js/parsers/flow/index.js";

test("getContextGroups > Empty arrays", (t) => {
  const nodes: Array<BaseNode> = [];
  const comments: Array<Comment> = [];

  const result = getContextGroups(nodes, comments, "");

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 0);
  t.is(result[0].comments.length, 0);
});

test("getContextGroups > Spaces within nodes but not around", (t) => {
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

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 2);
  t.is(result[0].comments.length, 0);
});

test("getContextGroups > Comments - Single context group > comment top", (t) => {
  const input = `
      // First
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 0);
  t.is(result[0].comments.length, 1);
});

test("getContextGroups > Comments - Single context group > node", (t) => {
  const input = `
      log("First");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 1);
  t.is(result[0].comments.length, 0);
});

test("getContextGroups > Comments - Single context group > comment top, node", (t) => {
  const input = `
      // First
      log("First");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 1);
  t.is(result[0].comments.length, 0);
});

test("getContextGroups > Comments - Single context group > comment top, comment top, node", (t) => {
  const input = `
      // First
      // First - 2
      log("First");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 1);
  t.is(result[0].comments.length, 0);
});

test("getContextGroups > Comments - Single context group > comment top, node, comment top, node", (t) => {
  const input = `
      // First
      log("First");
      // Second
      log("Second");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 2);
  t.is(result[0].comments.length, 2);
});

test("getContextGroups > Comments - Single context group > comment top, node, node", (t) => {
  const input = `
      // First
      log("First");
      log("Second");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 2);
  t.is(result[0].comments.length, 0);
});

test("getContextGroups > Comments - Single context group > node, comment top", (t) => {
  const input = `
      log("First");
      // Second
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 1);
  t.is(result[0].comments.length, 0);
});

test("getContextGroups > Comments - Single context group > node, comment top, node", (t) => {
  const input = `
      log("First");
      // Second
      log("Second");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 2);
  t.is(result[0].comments.length, 1);
});

test("getContextGroups > Comments - Single context group > node, comment right", (t) => {
  const input = `
      log("First")  // First;
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 1);
  t.is(result[0].comments.length, 1);
});

test("getContextGroups > Comments - Single context group > comment, node, comment right", (t) => {
  const input = `
      // First
      log("First")  // First
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 1);
  t.is(result[0].comments.length, 2);
});

test("getContextGroups > Comments - Single context group > node, comment right, node", (t) => {
  const input = `
      log("First"); // First
      log("Second");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 2);
  t.is(result[0].comments.length, 1);
});

test("getContextGroups > Comments - Single context group > node, block comment right, node", (t) => {
  const input = `
      log("First"); /* First */
      log("Second");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 2);
  t.is(result[0].comments.length, 1);
});

test("getContextGroups > Comments - Single context group > node, comment right, node, comment right", (t) => {
  const input = `
      log("First"); // First
      log("Second"); // Second
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 2);
  t.is(result[0].comments.length, 2);
});

test("getContextGroups > Comments - Single context group > comment, node, comment, node all on one line", (t) => {
  const input = `
      /* First */ log("First"); /* Second */ log("Second");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 2);
  t.is(result[0].comments.length, 2);
});

test("getContextGroups > Comments - Single context group > node, comment right, break, comment front, node, comment right", (t) => {
  const input = `
      log("First"); // First
      /* Second */ log("Second");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 2);
  t.is(result[0].comments.length, 2);
});

test("getContextGroups > Comments - Multiple context groups > comment, node, break, comment, node", (t) => {
  const input = `
      // First
      log("First");

      // Second
      log("Second");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 2);
  t.is(result[0].nodes.length, 1);
  t.is(result[0].comments.length, 0);
  t.is(result[1].nodes.length, 1);
  t.is(result[1].comments.length, 0);
});

test("getContextGroups > Comments - Multiple context groups > comment, break, node, comment, node", (t) => {
  const input = `
      // First

      log("First");
      // Second
      log("Second");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 2);
  t.is(result[0].comments.length, 1);
});

// comments after a section group aren't included in the next group but also not the previous group as they won't ever be moved.
// This means that `// First` is the "context" comment for the first group, `// Second` is ignored and the second context group
// has no comments
test("getContextGroups > Comments - Multiple context groups > comment, node, comment, break, node", (t) => {
  const input = `
      // First
      log("First");
      // Second

      log("Second");
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 2);
  t.is(result[0].nodes.length, 1);
  t.is(result[0].comments.length, 0);
  t.is(result[1].nodes.length, 1);
  t.is(result[1].comments.length, 0);
});

test("getContextGroups > Comments - Multiple context groups > comment, break, comment top, comment front, node, comment right", (t) => {
  const input = `
      // First

      // Second
      /* Second2 */ log("Second"); // Second-3
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 1);
  t.is(result[0].nodes.length, 1);
  t.is(result[0].comments.length, 3);
});

test("getContextGroups > Comments - Multiple context groups > comment top, comment front, node, comment right, break, comment top, comment front, node, comment right", (t) => {
  const input = `
      // First
      /* First2 */ log("First"); // First-3

      // Second
      /* Second2 */ log("Second"); // Second-3
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 2);
  t.is(result[0].nodes.length, 1);
  t.is(result[0].comments.length, 3);
  t.is(result[1].nodes.length, 1);
  t.is(result[1].comments.length, 3);
});

test("getContextGroups > Comments - Multiple context groups > comment top, comment front, node, comment right, break, comment top, comment top, comment front, node, comment right", (t) => {
  const input = `
      // First
      /* First2 */ log("First"); // First-3

      // Second1
      // Second11
      /* Second2 */ log("Second"); // Second-3
      `;
  const parsed = flowParse(input);
  const result = getContextGroups(parsed.body, parsed.comments, input);

  t.is(result.length, 2);
  t.is(result[0].nodes.length, 1);
  t.is(result[0].comments.length, 3);
  t.is(result[1].nodes.length, 1);
  t.is(result[1].comments.length, 4);
});
