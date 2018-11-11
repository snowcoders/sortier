import { startsWith } from "../../utilities/string-utils";

export function createError(message: string, loc: any) {
  // Construct an error similar to the ones thrown by Babylon.
  const error = new SyntaxError(
    message + " (" + loc.start.line + ":" + loc.start.column + ")"
  );
  return error;
}

export function includeShebang(text: string, ast: any) {
  if (!startsWith(text, "#!")) {
    return;
  }

  const index = text.indexOf("\n");
  const shebang = text.slice(2, index);
  const comment = {
    loc: {
      end: {
        column: index,
        line: 1
      },
      source: null,
      start: {
        column: 0,
        line: 1
      }
    },
    range: [0, index],
    type: "Line",
    value: shebang
  };

  ast.comments = [comment].concat(ast.comments);
}
