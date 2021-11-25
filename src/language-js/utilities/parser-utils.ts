export function createError(message: string, loc: any) {
  // Construct an error similar to the ones thrown by Babylon.
  const error = new SyntaxError(
    message + " (" + loc.start.line + ":" + loc.start.column + ")"
  );
  return error;
}

export function includeShebang(text: string, ast: any) {
  if (text.startsWith("#!")) {
    return;
  }

  const index = text.indexOf("\n");
  const shebang = text.slice(2, index);
  const comment = {
    loc: {
      end: {
        column: index,
        line: 1,
      },
      source: null,
      start: {
        column: 0,
        line: 1,
      },
    },
    range: [0, index],
    type: "Line",
    value: shebang,
  };

  ast.comments = [comment].concat(ast.comments);
}

// AST's apparently ignore parenthesis so when parsing something like
//    (undefined) | null | (() => {})
// You'll only get "undefined", "null", and "() => {}"
// We want to maintain parentheses when sorting union types
// and other items so we need to be smart about adding them back.
// This function currently only edits the "range" property but nothing else.
export function addParenthesis(fileContents: string, nodes: any[]) {
  return nodes.map((value) => {
    let charAt = "";

    // Find all the parenthesis before
    const startParenStack: number[] = [];
    for (let startIndex = value.range[0] - 1; 0 < startIndex; startIndex--) {
      charAt = fileContents.charAt(startIndex);
      if (charAt !== "(" && !/\s/.test(charAt)) {
        break;
      }
      if (charAt === "(") {
        startParenStack.push(startIndex);
      }
    }

    // Find all the parenthesis after
    const endParenStack: number[] = [];
    for (
      let endIndex = value.range[1];
      endIndex < fileContents.length;
      endIndex++
    ) {
      charAt = fileContents.charAt(endIndex);
      if (charAt !== ")" && !/\s/.test(charAt)) {
        break;
      }
      if (charAt === ")") {
        endParenStack.push(endIndex);
      }
    }

    // Make sure the stacks are the same length
    while (startParenStack.length < endParenStack.length) {
      endParenStack.pop();
    }
    while (endParenStack.length < startParenStack.length) {
      startParenStack.pop();
    }

    const newStartIndex = startParenStack.pop();
    let newEndIndex = endParenStack.pop();

    if (newStartIndex == null || newEndIndex == null) {
      return value;
    }

    newEndIndex++;
    return {
      ...value,
      range: [newStartIndex, newEndIndex],
    };
  });
}
