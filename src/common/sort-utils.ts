import { Comment } from "estree";

export type MinimumTypeInformation = {
  range?: number[]
};

export function reorderValues(fileContents: string, comments: Comment[], unsortedTypes: MinimumTypeInformation[], sortedTypes: MinimumTypeInformation[]) {
  let newFileContents = fileContents.slice();
  let newFileContentIndexCorrection = 0;
  // Now go through the original specifiers again and if any have moved, switch them
  for (let x = 0; x < unsortedTypes.length; x++) {
    let specifier = unsortedTypes[x];
    let newSpecifier = sortedTypes[x];

    let specifierRange = specifier.range;
    let newSpecifierRange = newSpecifier.range;

    let specifierComments = getCommentsForSpecifier(fileContents, comments, specifier);
    let newSpecifierComments = getCommentsForSpecifier(fileContents, comments, newSpecifier);

    // Swap the specifier comments (as they will be before the specifier)
    if (specifierComments.length !== 0 || newSpecifierComments.length !== 0) {
      let specifierCommentsStartRange = specifierComments[0].range;
      let specifierCommentsEndRange = specifierComments[specifierComments.length - 1].range;

      let newSpecifierCommentsStartRange = newSpecifierComments[0].range;
      let newSpecifierCommentsEndRange = newSpecifierComments[newSpecifierComments.length - 1].range;

      if (specifierCommentsStartRange == null ||
        specifierCommentsEndRange == null ||
        newSpecifierCommentsStartRange == null ||
        newSpecifierCommentsEndRange == null) {
        throw new Error("Comment specifier is unexpectedly null");
      }

      let spliceRemoveIndexStart = specifierCommentsStartRange[0] + newFileContentIndexCorrection;
      let spliceRemoveIndexEnd = specifierCommentsEndRange[1] + newFileContentIndexCorrection;

      let untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
      let untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

      let spliceAddIndexStart = newSpecifierCommentsStartRange[0];
      let spliceAddIndexEnd = newSpecifierCommentsEndRange[1];
      let stringToInsert = fileContents.substring(spliceAddIndexStart, spliceAddIndexEnd);

      newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
      newFileContentIndexCorrection += (spliceAddIndexEnd - spliceAddIndexStart) - (spliceRemoveIndexEnd - spliceRemoveIndexStart);
    }

    // Swap the specifier
    {
      if (specifierRange == null) {
        throw new Error("Range cannot be null");
      }
      if (newSpecifierRange == null) {
        throw new Error("Range cannot be null");
      }
      let spliceRemoveIndexStart = specifierRange[0] + newFileContentIndexCorrection;
      let spliceRemoveIndexEnd = specifierRange[1] + newFileContentIndexCorrection;

      let untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
      let untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

      let spliceAddIndexStart = newSpecifierRange[0];
      let spliceAddIndexEnd = newSpecifierRange[1];
      let stringToInsert = fileContents.substring(spliceAddIndexStart, spliceAddIndexEnd);

      newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
      newFileContentIndexCorrection += (spliceAddIndexEnd - spliceAddIndexStart) - (spliceRemoveIndexEnd - spliceRemoveIndexStart);
    }
  }

  return newFileContents;
}

// Currently we only accept full line comments before the specifier.
function getCommentsForSpecifier(fileContents: string, comments: Comment[], specifier: MinimumTypeInformation): Comment[] {
  if (specifier.range == null) {
    throw new Error("Should never pass in null locations into reorderValues");
  }

  // Determine the starting location of the comment
  let lastRange = specifier.range;
  let latestCommentIndex: number = -1;
  for (let index = 0; index < comments.length; index++) {
    let commentRange = comments[index].range;
    if (commentRange == null) {
      continue;
    }

    let textBetweenCommentAndSpecier = fileContents.substring(commentRange[1], lastRange[0])
    // Ignore opeators and whitespace
    if (textBetweenCommentAndSpecier.match(/[^(\|\&\+\-\*\/\s)]/igm)) {
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
    let previousComment = comments[earliestCommentIndex - 1].loc;
    let thisComment = comments[earliestCommentIndex].loc;

    if (previousComment == null || thisComment == null) {
      continue;
    }

    if (previousComment.end.line + 1 >= thisComment.start.line) {
      earliestCommentIndex--;
    }
    else {
      break;
    }
  }

  return comments.slice(earliestCommentIndex, latestCommentIndex + 1);
}
