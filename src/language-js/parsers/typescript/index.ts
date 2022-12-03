// Mostly taken from Prettier.io - Credit where credit is due!

import * as parser from "@typescript-eslint/typescript-estree";
import { createError, includeShebang } from "../../utilities/parser-utils.js";

export function parse(text: string /*, parsers, opts*/) {
  const jsx = isProbablyJsx(text);
  let ast;
  try {
    try {
      // Try passing with our best guess first.
      ast = tryParseTypeScript(text, jsx);
    } catch (e) {
      // But if we get it wrong, try the opposite.
      /* istanbul ignore next */
      ast = tryParseTypeScript(text, !jsx);
    }
  } catch (e) /* istanbul ignore next */ {
    if (e instanceof Error) {
      const { message } = e;
      if ("lineNumber" in e) {
        const { lineNumber } = e;
        if (typeof lineNumber === "number" && "column" in e) {
          const { column } = e;
          if (typeof column === "number") {
            throw createError(message, {
              start: { column: column + 1, line: lineNumber },
            });
          }
        }
        throw createError(message, {
          start: { column: undefined, line: lineNumber },
        });
      }
    }

    throw e;
  }

  // @ts-expect-error: I forked this from someone else, not changing it unless it breaks
  delete ast.tokens;
  includeShebang(text, ast);
  return ast;
}

function tryParseTypeScript(text: string, jsx: boolean) {
  return parser.parse(text, {
    comment: true,
    errorOnUnknownASTType: false,
    jsx: jsx,
    loc: true,
    range: true,
    tokens: true,
    useJSXTextNode: false,
    loggerFn: () => {
      // Override logger function with noop,
      // to avoid unsupported version errors being logged
    },
  });
}

/**
 * Use a naive regular expression to detect JSX
 */
function isProbablyJsx(text: string) {
  return new RegExp(
    [
      "(^[^\"'`]*</)", // Contains "</" when probably not in a string
      "|",
      "(^[^/]{2}.*/>)", // Contains "/>" on line not starting with "//"
    ].join(""),
    "m"
  ).test(text);
}
