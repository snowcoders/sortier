import { describe, it, expect } from "@jest/globals";
import { addParenthesis, createError, includeShebang } from "./parser-utils.js";

describe("language-js/parser-utils", () => {
  describe("createError", () => {
    it("Constructors an error", () => {
      const error = createError("message", { start: { column: 3, line: 2 } });
      expect(error).toBeDefined();
    });
  });

  describe("includeShebang", () => {
    it("Does not modify comments if shebang exists", () => {
      const array: Array<any> = [];
      const ast = { comments: array };
      includeShebang("#!message", ast);
      expect(ast.comments === array).toBe(true);
    });
  });

  describe("addParenthesis", () => {
    it("Basic add parenthesis for Flow", () => {
      const fileContents = `interface Definition { property: null | (   () => {}) | (undefined) }`;

      const nodes = [
        {
          loc: {
            end: { column: 37, line: 1 },
            source: null,
            start: { column: 33, line: 1 },
          },
          range: [33, 37],
          type: "NullLiteralTypeAnnotation",
        },
        {
          loc: {
            end: { column: 52, line: 1 },
            source: null,
            start: { column: 44, line: 1 },
          },
          params: [],
          range: [44, 52],
          rest: null,
          returnType: {
            callProperties: [],
            exact: false,
            indexers: [],
            inexact: false,
            internalSlots: [],
            loc: {
              end: { column: 52, line: 1 },
              source: null,
              start: { column: 50, line: 1 },
            },
            properties: [],
            range: [50, 52],
            type: "ObjectTypeAnnotation",
          },
          type: "FunctionTypeAnnotation",
          typeParameters: null,
        },
        {
          id: {
            loc: {
              end: { column: 66, line: 1 },
              source: null,
              start: { column: 57, line: 1 },
            },
            name: "undefined",
            optional: false,
            range: [57, 66],
            type: "Identifier",
            typeAnnotation: null,
          },
          loc: {
            end: { column: 66, line: 1 },
            source: null,
            start: { column: 57, line: 1 },
          },
          range: [57, 66],
          type: "GenericTypeAnnotation",
          typeParameters: null,
        },
      ];
      const newNodes = addParenthesis(fileContents, nodes);
      expect(newNodes[0].range[0]).toEqual(nodes[0].range[0]);
      expect(newNodes[0].range[1]).toEqual(nodes[0].range[1]);
      expect(newNodes[1].range[0]).toEqual(nodes[1].range[0] - 4);
      expect(newNodes[1].range[1]).toEqual(nodes[1].range[1] + 1);
      expect(newNodes[2].range[0]).toEqual(nodes[2].range[0] - 1);
      expect(newNodes[2].range[1]).toEqual(nodes[2].range[1] + 1);
    });

    it("Basic add parenthesis for Typescript", () => {
      const fileContents = `interface Definition { property: null | (   () => {}) | (undefined) }`;

      const nodes = [
        {
          loc: { end: { column: 37, line: 1 }, start: { column: 33, line: 1 } },
          range: [33, 37],
          type: "TSNullKeyword",
        },
        {
          loc: { end: { column: 53, line: 1 }, start: { column: 40, line: 1 } },
          range: [40, 53],
          type: "TSParenthesizedType",
          typeAnnotation: {
            loc: {
              end: { column: 52, line: 1 },
              start: { column: 40, line: 1 },
            },
            range: [40, 52],
            type: "TSTypeAnnotation",
            typeAnnotation: {
              loc: {
                end: { column: 52, line: 1 },
                start: { column: 44, line: 1 },
              },
              parameters: [],
              range: [44, 52],
              type: "TSFunctionType",
              typeAnnotation: {
                loc: {
                  end: { column: 52, line: 1 },
                  start: { column: 48, line: 1 },
                },
                range: [48, 52],
                type: "TSTypeAnnotation",
                typeAnnotation: {
                  loc: {
                    end: { column: 52, line: 1 },
                    start: { column: 50, line: 1 },
                  },
                  members: [],
                  range: [50, 52],
                  type: "TSTypeLiteral",
                },
              },
              typeParameters: null,
            },
          },
        },
        {
          loc: { end: { column: 67, line: 1 }, start: { column: 56, line: 1 } },
          range: [56, 67],
          type: "TSParenthesizedType",
          typeAnnotation: {
            loc: {
              end: { column: 66, line: 1 },
              start: { column: 56, line: 1 },
            },
            range: [56, 66],
            type: "TSTypeAnnotation",
            typeAnnotation: {
              loc: {
                end: { column: 66, line: 1 },
                start: { column: 57, line: 1 },
              },
              range: [57, 66],
              type: "TSUndefinedKeyword",
            },
          },
        },
      ];
      const newNodes = addParenthesis(fileContents, nodes);
      // Typescript takes parenthesis into the AST structure so everything should be good
      expect(newNodes[0].range[0]).toEqual(nodes[0].range[0]);
      expect(newNodes[0].range[1]).toEqual(nodes[0].range[1]);
      expect(newNodes[1].range[0]).toEqual(nodes[1].range[0]);
      expect(newNodes[1].range[1]).toEqual(nodes[1].range[1]);
      expect(newNodes[2].range[0]).toEqual(nodes[2].range[0]);
      expect(newNodes[2].range[1]).toEqual(nodes[2].range[1]);
    });
  });
});
