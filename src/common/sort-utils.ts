export function reorderValues(fileContents: string, unsortedTypes: any, sortedTypes: any) {
  let newFileContents = fileContents.slice();
  let newFileContentIndexCorrection = 0;
  // Now go through the original specifiers again and if any have moved, switch them
  for (let x = 0; x < unsortedTypes.length; x++) {
    let specifier = unsortedTypes[x];
    let newSpecifier = sortedTypes[x];

    let spliceRemoveIndexStart = (specifier.start || specifier.range[0]) + newFileContentIndexCorrection;
    let spliceRemoveIndexEnd = (specifier.end || specifier.range[1]) + newFileContentIndexCorrection;

    let untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
    let untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

    let spliceAddIndexStart = newSpecifier.range[0];
    let spliceAddIndexEnd = newSpecifier.range[1];
    let stringToInsert = fileContents.substring(spliceAddIndexStart, spliceAddIndexEnd);

    newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
    newFileContentIndexCorrection += (spliceAddIndexEnd - spliceAddIndexStart) - (spliceRemoveIndexEnd - spliceRemoveIndexStart);
  }

  return newFileContents;
}