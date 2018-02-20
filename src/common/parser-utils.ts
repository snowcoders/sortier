import { startsWith } from "./string-utils";

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
    type: "Line",
    value: shebang,
    range: [0, index],
    loc: {
      source: null,
      start: {
        line: 1,
        column: 0
      },
      end: {
        line: 1,
        column: index
      }
    }
  };

  ast.comments = [comment].concat(ast.comments);
}
