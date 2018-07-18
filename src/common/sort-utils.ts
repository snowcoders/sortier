import { Comment } from "estree";

export interface MinimumTypeInformation {
  range?: [number, number];
}

export interface ContextGroup {
  comments: Comment[];
  nodes: any[];
}

export function getSpreadGroups(
  allNodes: (MinimumTypeInformation & { type: string })[]
) {
  // Any time there is a spread operator, we need to sort around it... moving it could cause functionality changes
  let spreadGroups: any[] = [];
  let currentStart = 0;
  for (let x = 0; x < allNodes.length; x++) {
    if (
      allNodes[x].type.includes("Spread") ||
      allNodes[x].type.includes("Rest")
    ) {
      if (currentStart !== x) {
        spreadGroups.push(allNodes.slice(currentStart, x));
      }
      x++;
      currentStart = x;
    }
  }
  if (currentStart !== allNodes.length) {
    spreadGroups.push(allNodes.slice(currentStart));
  }

  return spreadGroups;
}

// Blank lines between cases are considered Context breakers... we don't sort through them.
export function getContextGroups(
  nodes: MinimumTypeInformation[],
  comments: Comment[],
  fileContents: string
): ContextGroup[] {
  comments = comments.filter(comment => {
    // There seems to be bugs with the parsers regarding certain comments
    // https://github.com/eslint/typescript-eslint-parser/issues/450
    return isValidComment(fileContents, comment);
  });

  if (nodes.length === 0) {
    return [
      {
        comments: comments,
        nodes: nodes
      }
    ];
  }

  // Determine the start and end of the nodes and comments provided
  let firstNodeLoc = nodes[0].range;
  let lastNodeLoc = nodes[nodes.length - 1].range;
  if (firstNodeLoc == null || lastNodeLoc == null) {
    throw new Error("Node location is null?");
  }
  let rangeStart = firstNodeLoc[0];
  let rangeEnd = lastNodeLoc[1];
  let firstNodeComments = getCommentsForSpecifier(
    fileContents,
    comments,
    nodes[0]
  );
  if (firstNodeComments.length > 0) {
    let firstNodeCommentsRange = firstNodeComments[0].range;
    if (firstNodeCommentsRange != null) {
      rangeStart = firstNodeCommentsRange[0];
    }
  }

  // Now figure out all the indexes of any whitespace surrounded by two new lines (e.g. context separator)
  let regex = /\n\s*\n/gim;
  let result: RegExpExecArray | null;
  let contextBarrierIndices: number[] = [];
  while ((result = regex.exec(fileContents))) {
    if (rangeStart < result.index && result.index < rangeEnd) {
      contextBarrierIndices.push(result.index);
    }
  }

  // Now that we have the indices of all context breaks, anything that is between those breaks will be a single context
  let groupings: ContextGroup[] = [];
  let nodeIndex = 0;
  let commentIndex = 0;

  while (contextBarrierIndices.length > 0) {
    let partialNodes: MinimumTypeInformation[] = [];
    let partialComments: Comment[] = [];
    let contextBarrierIndex = contextBarrierIndices.shift();

    if (contextBarrierIndex == null) {
      throw new Error("Context barrier index is null?");
    }

    // Nodes
    while (nodeIndex < nodes.length) {
      let range = nodes[nodeIndex].range;
      if (range == null) {
        throw new Error("Node location is null?");
      }
      if (contextBarrierIndex < range[1]) {
        break;
      }
      partialNodes.push(nodes[nodeIndex]);
      let nodeComments = getCommentsForSpecifier(
        fileContents,
        comments,
        nodes[nodeIndex]
      );
      partialComments.push(...nodeComments);
      nodeIndex++;
    }

    // If the only comments for the whole group are above the first node, it's contextual
    firstNodeComments = [];
    if (partialNodes.length > 0) {
      firstNodeComments = getCommentsForSpecifier(
        fileContents,
        comments,
        partialNodes[0]
      );
    }
    if (partialComments.length === firstNodeComments.length) {
      partialComments = [];
    }

    groupings.push({
      comments: partialComments,
      nodes: partialNodes
    });
  }

  let partialNodes = nodes.slice(nodeIndex);
  let partialComments: Comment[] = [];
  partialNodes.forEach(node => {
    let nodeComments = getCommentsForSpecifier(fileContents, comments, node);
    partialComments.push(...nodeComments);
  });

  // If the only comments for the whole group are above the first node, it's contextual
  firstNodeComments = [];
  if (partialNodes.length > 0) {
    firstNodeComments = getCommentsForSpecifier(
      fileContents,
      comments,
      partialNodes[0]
    );
  }
  if (partialComments.length === firstNodeComments.length) {
    partialComments = [];
  }

  if (commentIndex < comments.length || nodeIndex < nodes.length) {
    groupings.push({
      comments: partialComments,
      nodes: nodes.slice(nodeIndex)
    });
  }
  return groupings;
}

export function reorderValues(
  fileContents: string,
  comments: Comment[],
  unsortedTypes: MinimumTypeInformation[],
  sortedTypes: MinimumTypeInformation[]
) {
  if (unsortedTypes.length !== sortedTypes.length) {
    throw new Error(
      "Sortier ran into a problem - Expected the same number of unsorted types and sorted types to be provided"
    );
  }

  let newFileContents = fileContents.slice();
  let newFileContentIndexCorrection = 0;
  // Now go through the original specifiers again and if any have moved, switch them
  for (let x = 0; x < unsortedTypes.length; x++) {
    let specifier = unsortedTypes[x];
    let newSpecifier = sortedTypes[x];

    let specifierRange = specifier.range;
    let newSpecifierRange = newSpecifier.range;

    let specifierCommentRange = getCommentRangeForSpecifier(
      fileContents,
      comments,
      specifier
    );
    let newSpecifierCommentRange = getCommentRangeForSpecifier(
      fileContents,
      comments,
      newSpecifier
    );

    // As long as the comment isn't the same comment and one of the specifiers has a comment
    // Swap the specifier comments (as they will be before the specifier)
    if (
      specifierCommentRange[0] !== newSpecifierCommentRange[0] &&
      specifierCommentRange[1] !== newSpecifierCommentRange[1] &&
      (specifierCommentRange[0] !== specifierCommentRange[1] ||
        newSpecifierCommentRange[0] !== newSpecifierCommentRange[1])
    ) {
      let spliceRemoveIndexStart =
        specifierCommentRange[0] + newFileContentIndexCorrection;
      let spliceRemoveIndexEnd =
        specifierCommentRange[1] + newFileContentIndexCorrection;

      let untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
      let untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

      let spliceAddIndexStart = newSpecifierCommentRange[0];
      let spliceAddIndexEnd = newSpecifierCommentRange[1];
      let stringToInsert = fileContents.substring(
        spliceAddIndexStart,
        spliceAddIndexEnd
      );

      newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
      newFileContentIndexCorrection +=
        spliceAddIndexEnd -
        spliceAddIndexStart -
        (spliceRemoveIndexEnd - spliceRemoveIndexStart);
    }

    // Swap the specifier
    {
      if (specifierRange == null) {
        throw new Error("Range cannot be null");
      }
      if (newSpecifierRange == null) {
        throw new Error("Range cannot be null");
      }
      let spliceRemoveIndexStart =
        specifierRange[0] + newFileContentIndexCorrection;
      let spliceRemoveIndexEnd =
        specifierRange[1] + newFileContentIndexCorrection;

      let untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
      let untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

      let spliceAddIndexStart = newSpecifierRange[0];
      let spliceAddIndexEnd = newSpecifierRange[1];
      let stringToInsert = fileContents.substring(
        spliceAddIndexStart,
        spliceAddIndexEnd
      );

      newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
      newFileContentIndexCorrection +=
        spliceAddIndexEnd -
        spliceAddIndexStart -
        (spliceRemoveIndexEnd - spliceRemoveIndexStart);
    }
  }

  return newFileContents;
}

function getCommentRangeForSpecifier(
  fileContents: string,
  comments: Comment[],
  specifier: MinimumTypeInformation
): [number, number] {
  // Determine where the specifier line starts
  let range = specifier.range;
  if (range == null) {
    throw new Error("Specifier cannot have a null range");
  }

  let specifierComments = getCommentsForSpecifier(
    fileContents,
    comments,
    specifier
  );

  // If the specifier comments are block comments infront of the specifier
  if (specifierComments.length >= 1 && specifierComments[0].type === "Block") {
    let firstCommentRange = specifierComments[0].range;
    let lastCommentRange =
      specifierComments[specifierComments.length - 1].range;
    if (firstCommentRange == null || lastCommentRange == null) {
      throw new Error("Comment cannot have a null range");
    }

    if (
      fileContents.substring(lastCommentRange[1], range[0]).indexOf("\n") === -1
    ) {
      return [firstCommentRange[0], lastCommentRange[1]];
    }
  }
  let indexOfNewLineBeforeSpecifier = fileContents
    .substring(0, range[0])
    .lastIndexOf("\n");
  let textBetweenLineAndSpecifier = fileContents.substring(
    indexOfNewLineBeforeSpecifier,
    range[0]
  );
  let firstIndexOfNonWhitespace = textBetweenLineAndSpecifier.search(
    /[^(\s)]/gim
  );
  if (firstIndexOfNonWhitespace === -1) {
    firstIndexOfNonWhitespace = textBetweenLineAndSpecifier.length;
  }
  let specifierLineStart =
    indexOfNewLineBeforeSpecifier + firstIndexOfNonWhitespace;

  // If we got a comment for the specifier, lets set up it's range and use it
  if (specifierComments.length !== 0) {
    let firstComment = specifierComments[0];

    if (firstComment.range != null && specifier.range != null) {
      return [firstComment.range[0], specifierLineStart];
    }
  }

  return [specifierLineStart, specifierLineStart];
}

// Currently we only accept comments before the specifier.
function getCommentsForSpecifier(
  fileContents: string,
  comments: Comment[],
  specifier: MinimumTypeInformation
): Comment[] {
  if (specifier.range == null) {
    throw new Error("Should never pass in null locations into reorderValues");
  }

  comments = comments.filter(comment => {
    // There seems to be bugs with the parsers regarding certain comments
    // https://github.com/eslint/typescript-eslint-parser/issues/450
    return isValidComment(fileContents, comment);
  });

  // Determine the starting location of the comment
  let lastRange = specifier.range;
  let latestCommentIndex: number = -1;
  for (let index = 0; index < comments.length; index++) {
    let commentRange = comments[index].range;
    if (commentRange == null) {
      continue;
    }

    if (commentRange[0] > lastRange[0]) {
      break;
    }

    let textBetweenCommentAndSpecier = fileContents.substring(
      commentRange[1],
      lastRange[0]
    );
    // Ignore opeators and whitespace
    if ((textBetweenCommentAndSpecier.match(/\n/gim) || []).length > 1) {
      continue;
    } else {
      latestCommentIndex = index;
    }
  }

  if (latestCommentIndex === -1) {
    return [];
  }

  let earliestCommentIndex = latestCommentIndex;

  while (earliestCommentIndex > 0) {
    let previousComment = comments[earliestCommentIndex - 1].range;
    let thisComment = comments[earliestCommentIndex].range;

    if (previousComment == null || thisComment == null) {
      throw new Error("Comment cannot have a null range");
    }

    let textBetweenCommentAndSpecier = fileContents.substring(
      previousComment[1],
      thisComment[0]
    );
    // Ignore opeators and whitespace
    if (textBetweenCommentAndSpecier.match(/[^(\|\&\+\-\*\/\s)]/gim)) {
      break;
    } else {
      earliestCommentIndex--;
    }
  }

  return comments.slice(earliestCommentIndex, latestCommentIndex + 1);
}

function isValidComment(fileContents: string, comment: Comment) {
  let commentRange = comment.range;
  if (commentRange == null) {
    return false;
  }

  if (
    comment.type === "Line" &&
    !fileContents.substring(commentRange[0], commentRange[1]).startsWith("//")
  ) {
    return false;
  }

  if (
    comment.type === "Block" &&
    !fileContents.substring(commentRange[0], commentRange[1]).startsWith("/*")
  ) {
    return false;
  }

  return true;
}
