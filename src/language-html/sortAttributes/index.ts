interface AttrInfo {
  endOffset: number;
  key: string;
  source: string;
  startOffset: number;
}

export function sortAttributes(node: any, fileContents: string) {
  // No-op scenarios
  if (node == null || node.attrs == null) {
    return fileContents;
  }
  let attrs: any[] = node.attrs;
  if (attrs.length === 0) {
    return fileContents;
  }

  // Actual sorting
  let originalOrder: AttrInfo[] = attrs.map(value => {
    let startOffset = value.sourceSpan.start.offset;
    let endOffset = value.sourceSpan.end.offset;
    let result: AttrInfo = {
      endOffset,
      key: value.name,
      source: fileContents.substring(startOffset, endOffset),
      startOffset
    };
    return result;
  });

  let newOrder = originalOrder.slice();
  newOrder.sort((a, b) => {
    return a.key.localeCompare(b.key);
  });

  return reorderValues(fileContents, originalOrder, newOrder);
}

function reorderValues(
  fileContents: string,
  unsortedTypes: AttrInfo[],
  sortedTypes: AttrInfo[]
) {
  if (unsortedTypes.length !== sortedTypes.length) {
    throw new Error(
      "Sortier ran into a problem - Expected the same number of unsorted types and sorted types to be provided"
    );
  }

  let offsetCorrection = 0;
  let newFileContents = fileContents.slice();

  for (let x = 0; x < unsortedTypes.length; x++) {
    let unsorted = unsortedTypes[x];
    let sorted = sortedTypes[x];
    let beginning = newFileContents.slice(
      0,
      unsorted.startOffset + offsetCorrection
    );
    let end = newFileContents.slice(unsorted.endOffset + offsetCorrection);
    newFileContents = beginning + sorted.source + end;
    offsetCorrection +=
      sorted.source.length - (unsorted.endOffset - unsorted.startOffset);
  }

  return newFileContents;
}
