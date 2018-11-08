// Mostly taken from Prettier.io - Credit where credit is due!

import * as parser from "typescript-estree";
import { createError, includeShebang } from "../../common/parser-utils";

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
    if (typeof e.lineNumber === "undefined") {
      throw e;
    }

    throw createError(e.message, {
      start: { column: e.column + 1, line: e.lineNumber }
    });
  }

  delete ast.tokens;
  includeShebang(text, ast);
  return ast;
}

function tryParseTypeScript(text: string, jsx: boolean) {
  return parser.parse(text, {
    comment: true,
    errorOnUnknownASTType: false,
    jsx: true,
    loc: true,
    range: true,
    tokens: true,
    useJSXTextNode: false,
    // Override logger function with noop,
    // to avoid unsupported version errors being logged
    loggerFn: () => {}
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
      "(^[^/]{2}.*/>)" // Contains "/>" on line not starting with "//"
    ].join(""),
    "m"
  ).test(text);
}
