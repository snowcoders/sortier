import { Comment } from "estree";

export type MinimumTypeInformation = {
  range?: [number, number]
};

export function reorderValues(fileContents: string, comments: Comment[], unsortedTypes: MinimumTypeInformation[], sortedTypes: MinimumTypeInformation[]) {
  if (unsortedTypes.length !== sortedTypes.length) {
    throw new Error("Sortier ran into a problem - Expected the same number of unsorted types and sorted types to be provided");
  }

  let newFileContents = fileContents.slice();
  let newFileContentIndexCorrection = 0;
  // Now go through the original specifiers again and if any have moved, switch them
  for (let x = 0; x < unsortedTypes.length; x++) {
    let specifier = unsortedTypes[x];
    let newSpecifier = sortedTypes[x];

    let specifierRange = specifier.range;
    let newSpecifierRange = newSpecifier.range;

    let specifierCommentRange = getCommentRangeForSpecifier(fileContents, comments, specifier);
    let newSpecifierCommentRange = getCommentRangeForSpecifier(fileContents, comments, newSpecifier);

    // Swap the specifier comments (as they will be before the specifier)
    if (specifierCommentRange[0] !== specifierCommentRange[1] ||
      newSpecifierCommentRange[0] !== newSpecifierCommentRange[1]) {
      let spliceRemoveIndexStart = specifierCommentRange[0] + newFileContentIndexCorrection;
      let spliceRemoveIndexEnd = specifierCommentRange[1] + newFileContentIndexCorrection;

      let untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
      let untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

      let spliceAddIndexStart = newSpecifierCommentRange[0];
      let spliceAddIndexEnd = newSpecifierCommentRange[1];
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

function getCommentRangeForSpecifier(fileContents: string, comments: Comment[], specifier: MinimumTypeInformation): [number, number] {
  let specifierComments = getCommentsForSpecifier(fileContents, comments, specifier);

  // Determine where the specifier line starts
  let range = specifier.range;
  if (range == null) {
    throw new Error("Specifier cannot have a null range");
  }
  let indexOfNewLineBeforeSpecifier = fileContents.substring(0, range[0]).lastIndexOf("\n");
  let textBetweenLineAndSpecifier = fileContents.substring(indexOfNewLineBeforeSpecifier, range[0]);
  let firstIndexOfNonWhitespace = textBetweenLineAndSpecifier.search(/[^(\s)]/igm);
  if (firstIndexOfNonWhitespace === -1) {
    firstIndexOfNonWhitespace = textBetweenLineAndSpecifier.length;
  }
  let specifierLineStart = indexOfNewLineBeforeSpecifier + firstIndexOfNonWhitespace;

  // If we got a comment for the specifier, lets set up it's range and use it
  if (specifierComments.length !== 0) {
    let firstComment = specifierComments[0];

    if (firstComment.range != null &&
      specifier.range != null) {
      return [firstComment.range[0], specifierLineStart];
    }
  }

  return [specifierLineStart, specifierLineStart];
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
    // There seems to be bugs with the parsers regarding certain comments
    // https://github.com/eslint/typescript-eslint-parser/issues/450
    if (!isValidComment(fileContents, comments[index])) {
      continue;
    }

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

function isValidComment(fileContents: string, comment: Comment) {
  let commentRange = comment.range;
  if (commentRange == null) {
    return false
  }

  if (comment.type === "Line" && !fileContents.substring(commentRange[0], commentRange[1]).startsWith("//")) {
    return false;
  }

  if (comment.type === "Block" && !fileContents.substring(commentRange[0], commentRange[1]).startsWith("/*")) {
    return false;
  }

  return true;
}