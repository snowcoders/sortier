import { Comment } from "estree";

import {
  getContextGroups,
  getObjectTypeRanks,
  getSpreadGroups,
  reorderValues,
  TypeAnnotationOption
} from "../utilities/sort-utils";

export interface SortTSPropertySignaturesOptions {
  groups?: TypeAnnotationOption[];
}

export function sortTSPropertySignatures(
  properties: any,
  comments: Comment[],
  fileContents: string,
  options: SortTSPropertySignaturesOptions
) {
  let newFileContents = fileContents.slice();
  let allNodes: any[] = cleanProperties(fileContents, properties);

  // Any time there is a spread operator, we need to sort around it... moving it could cause functionality changes
  let spreadGroups: any[] = getSpreadGroups(allNodes);

  for (let nodes of spreadGroups) {
    let contextGroups = getContextGroups(nodes, comments, fileContents);

    contextGroups.forEach(element => {
      let unsorted: any[] = element.nodes;
      let sorted: any[] = element.nodes.slice().sort((a, b) => {
        let aGroup = getSortGroupIndex(a, options);
        let bGroup = getSortGroupIndex(b, options);

        if (aGroup != bGroup) {
          return aGroup - bGroup;
        }

        let aString = getString(a, fileContents);
        let bString = getString(b, fileContents);

        return aString.localeCompare(bString);
      });

      newFileContents = reorderValues(
        newFileContents,
        element.comments,
        unsorted,
        sorted
      );
    });
  }

  return newFileContents;
}

function cleanProperties(fileContents: string, properties: any[]) {
  // Interface properties are read in as "property: number," where we don't want to move the commas
  return properties.map((property: any) => {
    let lastIndex = property.range[1];
    if (0 < lastIndex && fileContents[lastIndex - 1] === ",") {
      lastIndex--;
    }

    return {
      ...property,
      range: [property.range[0], lastIndex]
    };
  });
}

function getString(property, fileContents: string) {
  return fileContents.substring(property.range[0], property.range[1]);
}

function getSortGroupIndex(
  property,
  options: SortTSPropertySignaturesOptions
): number {
  let ranks = getObjectTypeRanks(options.groups);

  if (
    property.type === "TSMethodSignature" ||
    property.typeAnnotation.typeAnnotation.type === "TSFunctionType"
  ) {
    return ranks.function;
  } else if (property.typeAnnotation.typeAnnotation.type === "TSTypeLiteral") {
    return ranks.object;
  }
  return ranks.everything;
}
