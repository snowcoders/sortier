// Mostly taken from Prettier.io - Credit where credit is due!

import * as flowParser from "flow-parser";
import { createError, includeShebang } from "../../common/parser-utils";

export function parse(text: string /*, parsers, opts*/) {
  const ast = flowParser.parse(text, {
    esproposal_class_instance_fields: true,
    esproposal_class_static_fields: true,
    esproposal_export_star_as: true
  });

  if (ast.errors.length > 0) {
    const loc = ast.errors[0].loc;
    throw createError(ast.errors[0].message, {
      end: { column: loc.end.column + 1, line: loc.end.line },
      start: { column: loc.start.column + 1, line: loc.start.line }
    });
  }

  includeShebang(text, ast);
  return ast;
}
