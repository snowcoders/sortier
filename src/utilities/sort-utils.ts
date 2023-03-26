import { StringUtils } from "./string-utils.js";

export interface BaseNode {
  range?: [number, number];
}

export interface Comment extends BaseNode {
  type: "Block" | "Line";
}

export function compare(a: number | string, b: number | string): number {
  const aType = typeof a;
  const bType = typeof b;
  if (aType !== bType) {
    return compare(aType, bType);
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

export interface ContextGroup<NodeType extends BaseNode, CommentType extends Comment> {
  comments: CommentType[];
  nodes: NodeType[];
}

// Blank lines between cases are considered Context breakers... we don't sort through them.
export function getContextGroups<NodeType extends BaseNode, CommentType extends Comment>(
  nodes: NodeType[],
  comments: CommentType[],
  fileContents: string
): ContextGroup<NodeType, CommentType>[] {
  comments = comments.filter((comment) => {
    // There seems to be bugs with the parsers regarding certain comments
    // https://github.com/eslint/typescript-eslint-parser/issues/450
    return isValidComment(fileContents, comment);
  });

  if (nodes.length === 0) {
    return [
      {
        comments: comments,
        nodes: nodes,
      },
    ];
  }

  // Determine the start and end of the nodes and comments provided
  const firstNodeLoc = nodes[0].range;
  const lastNodeLoc = nodes[nodes.length - 1].range;
  if (firstNodeLoc == null || lastNodeLoc == null) {
    throw new Error("Node location is null?");
  }
  let rangeStart = firstNodeLoc[0];
  let rangeEnd = lastNodeLoc[1];
  let firstNodeComments = getPrecedingCommentsForSpecifier(fileContents, comments, nodes[0]);
  if (firstNodeComments.length > 0) {
    const firstNodeCommentsRange = firstNodeComments[0].range;
    if (firstNodeCommentsRange != null) {
      rangeStart = firstNodeCommentsRange[0];
    }
  }
  const lastNodeComments = getSucceedingCommentsForSpecifier(fileContents, comments, nodes[nodes.length - 1]);
  if (lastNodeComments.length > 0) {
    const lastNodeCommentsRange = lastNodeComments[lastNodeComments.length - 1].range;
    if (lastNodeCommentsRange != null) {
      rangeEnd = lastNodeCommentsRange[1];
    }
  }

  // For performance, shorten the comments array to only the comments that are between what is provided
  comments = comments.filter((comment) => {
    if (comment.range != null) {
      return rangeStart <= comment.range[0] && comment.range[0] <= rangeEnd;
    }
    return true;
  });

  // Now figure out all the indexes of any whitespace surrounded by two new lines (e.g. context separator)
  const contextBarrierIndices = StringUtils.getBlankLineLocations(fileContents, rangeStart, rangeEnd);

  // Now that we have the indices of all context breaks, anything that is between those breaks will be a single context
  const groupings: ContextGroup<NodeType, CommentType>[] = [];
  let nodeIndex = 0;
  const commentIndex = 0;

  while (contextBarrierIndices.length > 0) {
    const partialNodes: NodeType[] = [];
    let partialComments: CommentType[] = [];
    let contextBarrierIndex = contextBarrierIndices.shift();

    if (contextBarrierIndex == null) {
      throw new Error("Context barrier index is null?");
    }

    // Nodes
    while (nodeIndex < nodes.length) {
      const node = nodes[nodeIndex];
      const range = node.range;
      if (range == null) {
        continue;
      }

      // Deal with context barriers if its between the last node and the current
      if (contextBarrierIndex != null && nodeIndex > 0) {
        const lastNode = nodes[nodeIndex - 1];
        const lastRange = lastNode.range;
        if (lastRange != null) {
          while (contextBarrierIndex != null && contextBarrierIndex < lastRange[1]) {
            contextBarrierIndex = contextBarrierIndices.shift();
          }
          if (contextBarrierIndex != null && contextBarrierIndex >= lastRange[1] && contextBarrierIndex <= range[0]) {
            break;
          }
        }
      }

      partialNodes.push(node);
      const precedingComments = getPrecedingCommentsForSpecifier(fileContents, comments, node);
      const succeedingComments = getSucceedingCommentsForSpecifier(fileContents, comments, node);
      partialComments.push(...precedingComments, ...succeedingComments);
      nodeIndex++;
    }

    // If the only comments for the whole group are above the first node, it's contextual
    firstNodeComments = [];
    if (partialNodes.length > 0) {
      firstNodeComments = getPrecedingCommentsForSpecifier(fileContents, comments, partialNodes[0]);
    }
    if (partialComments.length === firstNodeComments.length) {
      partialComments = [];
    }

    groupings.push({
      comments: partialComments,
      nodes: partialNodes,
    });
  }

  const partialNodes = nodes.slice(nodeIndex);
  let partialComments: CommentType[] = [];
  partialNodes.forEach((node) => {
    const precedingComments = getPrecedingCommentsForSpecifier(fileContents, comments, node);
    const succeedingComments = getSucceedingCommentsForSpecifier(fileContents, comments, node);
    partialComments.push(...precedingComments, ...succeedingComments);
  });

  // If the only comments for the whole group are above the first node, it's contextual
  firstNodeComments = [];
  if (partialNodes.length > 0) {
    firstNodeComments = getPrecedingCommentsForSpecifier(fileContents, comments, partialNodes[0]);
  }
  if (partialComments.length === firstNodeComments.length) {
    partialComments = [];
  }

  if (commentIndex < comments.length || nodeIndex < nodes.length) {
    groupings.push({
      comments: partialComments,
      nodes: nodes.slice(nodeIndex),
    });
  }
  return groupings;
}

export function reorderValues<NodeType extends BaseNode, CommentType extends Comment>(
  fileContents: string,
  comments: CommentType[],
  unsortedTypes: NodeType[],
  sortedTypes: NodeType[]
) {
  if (unsortedTypes.length !== sortedTypes.length) {
    throw new Error(
      "Sortier ran into a problem - Expected the same number of unsorted types and sorted types to be provided"
    );
  }

  if (unsortedTypes.length === 1) {
    return fileContents;
  }

  let newFileContents = fileContents.slice();
  let newFileContentIndexCorrection = 0;
  // Now go through the original specifiers again and if any have moved, switch them
  for (let x = 0; x < unsortedTypes.length; x++) {
    const specifier = unsortedTypes[x];
    const newSpecifier = sortedTypes[x];

    // Checks to see if the two specifiers are actually the same thing
    if (specifier === newSpecifier) {
      continue;
    }
    const specifierRange = specifier.range;
    const newSpecifierRange = newSpecifier.range;
    if (specifierRange == null || newSpecifierRange == null) {
      throw new Error("Range cannot be null");
    }
    if (specifierRange[0] === newSpecifierRange[0] && specifierRange[1] === newSpecifierRange[1]) {
      continue;
    }

    // As long as the comment isn't the same comment and one of the specifiers has a comment
    // Swap the specifier comments (as they will be before the specifier)
    let specifierCommentRange = getPrecedingCommentRangeForSpecifier(fileContents, comments, specifier);
    let newSpecifierCommentRange = getPrecedingCommentRangeForSpecifier(fileContents, comments, newSpecifier);
    let noCommentsExist =
      specifierCommentRange[0] === specifierCommentRange[1] &&
      newSpecifierCommentRange[0] === newSpecifierCommentRange[1];
    if (
      !noCommentsExist &&
      specifierCommentRange[0] !== newSpecifierCommentRange[0] &&
      specifierCommentRange[1] !== newSpecifierCommentRange[1]
    ) {
      const spliceRemoveIndexStart = specifierCommentRange[0] + newFileContentIndexCorrection;
      const spliceRemoveIndexEnd = specifierCommentRange[1] + newFileContentIndexCorrection;

      const untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
      const untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

      const spliceAddIndexStart = newSpecifierCommentRange[0];
      const spliceAddIndexEnd = newSpecifierCommentRange[1];
      const stringToInsert = fileContents.substring(spliceAddIndexStart, spliceAddIndexEnd);

      newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
      newFileContentIndexCorrection +=
        spliceAddIndexEnd - spliceAddIndexStart - (spliceRemoveIndexEnd - spliceRemoveIndexStart);
    }

    // Swap the specifier
    {
      const spliceRemoveIndexStart = specifierRange[0] + newFileContentIndexCorrection;
      const spliceRemoveIndexEnd = specifierRange[1] + newFileContentIndexCorrection;

      const untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
      const untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

      const spliceAddIndexStart = newSpecifierRange[0];
      const spliceAddIndexEnd = newSpecifierRange[1];
      const stringToInsert = fileContents.substring(spliceAddIndexStart, spliceAddIndexEnd);

      newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
      newFileContentIndexCorrection +=
        spliceAddIndexEnd - spliceAddIndexStart - (spliceRemoveIndexEnd - spliceRemoveIndexStart);
    }

    // As long as the comment isn't the same comment and one of the specifiers has a comment
    // Swap the specifier comments (as they will be before the specifier)
    specifierCommentRange = getSucceedingCommentRangeForSpecifier(fileContents, comments, specifier);
    newSpecifierCommentRange = getSucceedingCommentRangeForSpecifier(fileContents, comments, newSpecifier);
    noCommentsExist =
      specifierCommentRange[0] === specifierCommentRange[1] &&
      newSpecifierCommentRange[0] === newSpecifierCommentRange[1];
    if (
      !noCommentsExist &&
      specifierCommentRange[0] !== newSpecifierCommentRange[0] &&
      specifierCommentRange[1] !== newSpecifierCommentRange[1]
    ) {
      const spliceRemoveIndexStart = specifierCommentRange[0] + newFileContentIndexCorrection;
      const spliceRemoveIndexEnd = specifierCommentRange[1] + newFileContentIndexCorrection;

      const untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
      const untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

      const spliceAddIndexStart = newSpecifierCommentRange[0];
      const spliceAddIndexEnd = newSpecifierCommentRange[1];
      const stringToInsert = fileContents.substring(spliceAddIndexStart, spliceAddIndexEnd);

      newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
      newFileContentIndexCorrection +=
        spliceAddIndexEnd - spliceAddIndexStart - (spliceRemoveIndexEnd - spliceRemoveIndexStart);
    }
  }

  return newFileContents;
}

function getPrecedingCommentRangeForSpecifier<NodeType extends BaseNode, CommentType extends Comment>(
  fileContents: string,
  comments: CommentType[],
  specifier: NodeType
): [number, number] {
  // Determine where the specifier line starts
  const range = specifier.range;
  if (range == null) {
    throw new Error("Specifier range cannot be null");
  }

  const specifierComments = getPrecedingCommentsForSpecifier(fileContents, comments, specifier);

  // If the specifier comments are block comments infront of the specifier
  if (specifierComments.length >= 1 && specifierComments[0].type === "Block") {
    const firstCommentRange = specifierComments[0].range;
    const lastCommentRange = specifierComments[specifierComments.length - 1].range;
    if (firstCommentRange == null || lastCommentRange == null) {
      throw new Error("Comment cannot have a null range");
    }

    const textBetweenCommentAndSpecifier = fileContents.substring(lastCommentRange[1], range[0]);
    if (textBetweenCommentAndSpecifier.indexOf("\n") === -1) {
      return [firstCommentRange[0], lastCommentRange[1] + textBetweenCommentAndSpecifier.length];
    }
  }
  const indexOfNewLineBeforeSpecifier = Math.max(0, fileContents.substring(0, range[0]).lastIndexOf("\n"));
  const textBetweenLineAndSpecifier = fileContents.substring(indexOfNewLineBeforeSpecifier, range[0]);
  let firstIndexOfNonWhitespace = textBetweenLineAndSpecifier.search(/[^(\s)]/gim);
  if (firstIndexOfNonWhitespace === -1) {
    firstIndexOfNonWhitespace = textBetweenLineAndSpecifier.length;
  }
  const specifierLineStart = indexOfNewLineBeforeSpecifier + firstIndexOfNonWhitespace;

  // If we got a comment for the specifier, lets set up it's range and use it
  if (specifierComments.length !== 0) {
    const firstComment = specifierComments[0];

    if (firstComment.range != null && specifier.range != null) {
      return [firstComment.range[0], specifierLineStart];
    }
  }

  return [specifierLineStart, specifierLineStart];
}

function getSucceedingCommentRangeForSpecifier<NodeType extends BaseNode, CommentType extends Comment>(
  fileContents: string,
  comments: CommentType[],
  specifier: NodeType
): [number, number] {
  // Determine where the specifier line starts
  const range = specifier.range;
  if (range == null) {
    throw new Error("Specifier range cannot be null");
  }

  let specifierEndOfLine = fileContents.indexOf("\r", range[1]);
  if (specifierEndOfLine === -1) {
    specifierEndOfLine = fileContents.indexOf("\n", range[1]);
  }
  if (specifierEndOfLine === -1) {
    specifierEndOfLine = fileContents.length;
  }
  const specifierComments = getSucceedingCommentsForSpecifier(fileContents, comments, specifier);

  // Null and empty checks
  if (specifierComments.length === 0) {
    return [specifierEndOfLine, specifierEndOfLine];
  }
  const firstCommentRange = specifierComments[0].range;
  const lastCommentRange = specifierComments[specifierComments.length - 1].range;
  if (firstCommentRange == null || lastCommentRange == null) {
    return [specifierEndOfLine, specifierEndOfLine];
  }

  // Determine where we need to copy paste from
  const textBetweenSpecifierAndComment = fileContents.substring(range[1], firstCommentRange[0]);
  const nonWhiteSpaceMatches = textBetweenSpecifierAndComment.match(/[^(\s)]/gim);
  let lastIndexOfNonWhitespace = 0;
  if (nonWhiteSpaceMatches != null && nonWhiteSpaceMatches.length !== 0) {
    lastIndexOfNonWhitespace =
      textBetweenSpecifierAndComment.lastIndexOf(nonWhiteSpaceMatches[nonWhiteSpaceMatches.length - 1]) + 1;
  }
  const specifierLineStart = range[1] + lastIndexOfNonWhitespace;

  return [specifierLineStart, lastCommentRange[1]];
}

// Currently we only accept comments before the specifier.
function getPrecedingCommentsForSpecifier<NodeType extends BaseNode, CommentType extends Comment>(
  fileContents: string,
  comments: CommentType[],
  specifier: NodeType
): CommentType[] {
  comments = comments.filter((comment) => {
    // There seems to be bugs with the parsers regarding certain comments
    // https://github.com/eslint/typescript-eslint-parser/issues/450
    return isValidComment(fileContents, comment);
  });

  const specifierRange = specifier.range;
  if (specifierRange == null) {
    return [];
  }

  // Determine the comment next to the specifier
  let latestCommentIndex = -1;
  let firstIndex = 0;
  let lastIndex = Math.max(0, comments.length - 1);
  let middleIndex = Math.floor((lastIndex + firstIndex) / 2);
  while (Math.abs(firstIndex - lastIndex) > 1) {
    const commentRange = comments[middleIndex].range;
    if (commentRange == null) {
      continue;
    }
    if (commentRange[0] < specifierRange[0]) {
      firstIndex = middleIndex;
      middleIndex = Math.floor((lastIndex + middleIndex) / 2);
    }
    if (commentRange[0] > specifierRange[0]) {
      lastIndex = middleIndex;
      middleIndex = Math.floor((firstIndex + middleIndex) / 2);
    }
  }
  for (let index = middleIndex; index < comments.length; index++) {
    const commentRange = comments[index].range;
    if (commentRange == null) {
      continue;
    }

    if (commentRange[0] > specifierRange[0]) {
      break;
    }
    const textBetweenStartOfLineAndComment = fileContents.substring(
      fileContents.lastIndexOf("\n", commentRange[0]) + 1,
      commentRange[0]
    );
    const textBetweenCommentAndSpecifier = fileContents.substring(commentRange[1], specifierRange[0]);
    const isTextBetweenStartOfLineAndCommentWhitespace = textBetweenStartOfLineAndComment.match(/[^\s]/gim) == null;
    const isCommentOwnedByPreviousLine =
      !isTextBetweenStartOfLineAndCommentWhitespace && textBetweenCommentAndSpecifier.indexOf("\n") !== -1;
    const isTextBetweenCommentAndSpecifierWhitespace = textBetweenCommentAndSpecifier.match(/[^\s]/gim) == null;
    const newLineCount = textBetweenCommentAndSpecifier.match(/\n/gim)?.length || 0;
    if (newLineCount <= 1 && isTextBetweenCommentAndSpecifierWhitespace && !isCommentOwnedByPreviousLine) {
      latestCommentIndex = index;
    }
  }

  // If there are multiple comments all stacked on one another on separate lines
  let earliestCommentIndex = latestCommentIndex;
  if (latestCommentIndex !== -1) {
    while (earliestCommentIndex > 0) {
      const previousComment = comments[earliestCommentIndex - 1].range;
      const thisComment = comments[earliestCommentIndex].range;

      if (previousComment == null || thisComment == null) {
        throw new Error("Comment cannot have a null range");
      }

      const textBetweenCommentAndSpecifier = fileContents.substring(previousComment[1], thisComment[0]);
      const textBetweenStartOfLineAndComment = fileContents.substring(
        fileContents.lastIndexOf("\n", previousComment[0]),
        previousComment[0]
      );
      const isTextBetweenStartOfLineAndCommentWhitespace = textBetweenStartOfLineAndComment.match(/[^\s]/gim) == null;
      const isCommentOwnedByPreviousLine =
        !isTextBetweenStartOfLineAndCommentWhitespace && textBetweenCommentAndSpecifier.indexOf("\n") !== -1;
      // Ignore opeators and whitespace
      const newLineCount = textBetweenCommentAndSpecifier.match(/\n/gim);
      if (
        textBetweenCommentAndSpecifier.match(/[^(|&+\-*/\s)]/gim) ||
        (newLineCount != null && 1 < newLineCount.length) ||
        isCommentOwnedByPreviousLine
      ) {
        break;
      } else {
        earliestCommentIndex--;
      }
    }
  }

  if (latestCommentIndex === -1) {
    return [];
  }

  if (earliestCommentIndex === -1) {
    earliestCommentIndex = latestCommentIndex;
  }

  return comments.slice(earliestCommentIndex, latestCommentIndex + 1);
}

function getSucceedingCommentsForSpecifier<NodeType extends BaseNode, CommentType extends Comment>(
  fileContents: string,
  comments: CommentType[],
  specifier: NodeType
): CommentType[] {
  comments = comments.filter((comment) => {
    // There seems to be bugs with the parsers regarding certain comments
    // https://github.com/eslint/typescript-eslint-parser/issues/450
    return isValidComment(fileContents, comment);
  });

  const lastRange = specifier.range;
  if (lastRange == null) {
    return [];
  }

  let firstIndex = 0;
  let lastIndex = Math.max(0, comments.length - 1);
  let middleIndex = Math.floor((lastIndex + firstIndex) / 2);
  while (Math.abs(firstIndex - lastIndex) > 1) {
    const commentRange = comments[middleIndex].range;
    if (commentRange == null) {
      continue;
    }
    if (commentRange[0] < lastRange[0]) {
      firstIndex = middleIndex;
      middleIndex = Math.floor((lastIndex + middleIndex) / 2);
    }
    if (commentRange[0] > lastRange[0]) {
      lastIndex = middleIndex;
      middleIndex = Math.floor((firstIndex + middleIndex) / 2);
    }
  }
  for (let index = middleIndex; index < comments.length; index++) {
    const comment = comments[index];
    const commentRange = comment.range;
    if (commentRange == null) {
      continue;
    }

    // Comment is before the specifier
    if (commentRange[0] < lastRange[0]) {
      continue;
    }

    const textBetweenCommentAndSpecifier = fileContents.substring(lastRange[1], commentRange[0]);
    const nextNewLine = fileContents.indexOf("\n", lastRange[1]);
    const textBetweenCommentAndEndOfLine = fileContents.substring(
      commentRange[1],
      nextNewLine === -1 ? undefined : nextNewLine
    );
    const isTextBetweenCommentAndSpecifierWhitespaceButNotNewline =
      textBetweenCommentAndSpecifier.match(/[\w\n]/gim) == null;
    const isTextBetweenCommentAndEndOfLineWhitespaceButNotNewline =
      textBetweenCommentAndEndOfLine.match(/[\w\n]/gim) == null;
    if (
      isTextBetweenCommentAndSpecifierWhitespaceButNotNewline &&
      isTextBetweenCommentAndEndOfLineWhitespaceButNotNewline
    ) {
      // TODO test multiple block comments at the end of the line
      return comments.slice(index, index + 1);
    }
    break;
  }

  return [];
}

function isValidComment(fileContents: string, comment: Comment) {
  const commentRange = comment.range;
  if (commentRange == null) {
    return false;
  }

  if (comment.type === "Line" && !fileContents.substring(commentRange[0], commentRange[1]).startsWith("//")) {
    return false;
  }

  if (comment.type === "Block" && !fileContents.substring(commentRange[0], commentRange[1]).startsWith("/*")) {
    return false;
  }

  return true;
}

export function isIgnored<NodeType extends BaseNode, CommentType extends Comment>(
  fileContents: string,
  comments: CommentType[],
  node: NodeType
) {
  if (node.range == null) {
    return false;
  }
  const newLineBeforeRange = fileContents.lastIndexOf("\n", node.range[0]);
  if (newLineBeforeRange === -1) {
    return false;
  }
  let beginningOfLine = fileContents.lastIndexOf("\n", newLineBeforeRange - 1);
  beginningOfLine = beginningOfLine === -1 ? 0 : beginningOfLine;

  const commentText = fileContents.substring(beginningOfLine, newLineBeforeRange);
  if (commentText.indexOf("sortier-ignore-nodes") !== -1) {
    return true;
  }
  if (commentText.indexOf("sortier-ignore-next-line") === -1) {
    return false;
  }
  const nodeText = fileContents.substring(node.range[0], node.range[1]);
  return nodeText.indexOf("\n") === -1;
}
