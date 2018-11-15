import { StringUtils } from "../../utilities/string-utils";

interface AttrInfo {
  endOffset: number;
  source: string;
  startOffset: number;
}

export function sortAttributes(node: any, fileContents: string) {
  // No-op scenarios
  if (node == null || node.attrs == null) {
    return fileContents;
  }
  let attrs: any[] = node.attrs;
  if (attrs.length <= 1) {
    return fileContents;
  }

  // Split attributes into context blocks
  let contextBarrierIndices = StringUtils.getBlankLineLocations(
    fileContents,
    node.sourceSpan.start.offset,
    node.sourceSpan.end.offset
  );
  let attributeInfos: AttrInfo[] = attrs.map(value => {
    let startOffset = value.sourceSpan.start.offset;
    let endOffset = value.sourceSpan.end.offset;
    let result: AttrInfo = {
      endOffset,
      source: fileContents.substring(startOffset, endOffset),
      startOffset
    };
    return result;
  });
  let groupedAttributes: AttrInfo[][] = [];
  let currentGroup: AttrInfo[] = [];
  while (0 < contextBarrierIndices.length) {
    let barrierIndex = contextBarrierIndices.shift();
    if (barrierIndex == null) {
      break;
    }
    while (0 < attributeInfos.length) {
      let attributeInfo = attributeInfos.shift();
      if (attributeInfo == null) {
        break;
      }
      if (attributeInfo.startOffset > barrierIndex) {
        if (currentGroup.length !== 0) {
          groupedAttributes.push(currentGroup);
          currentGroup = [];
        }
      }
      currentGroup.push(attributeInfo);
    }
  }
  if (currentGroup.length !== 0) {
    groupedAttributes.push(currentGroup);
  }
  if (attributeInfos.length !== 0) {
    groupedAttributes.push(attributeInfos);
  }

  // Actual sorting
  let newFileContents = fileContents;
  for (let group of groupedAttributes) {
    let newOrder = group.slice();
    newOrder.sort((a, b) => {
      return a.source.localeCompare(b.source);
    });

    newFileContents = reorderValues(newFileContents, group, newOrder);
  }
  return newFileContents;
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
