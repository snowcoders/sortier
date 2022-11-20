import { Comment } from "estree";

import { compare, getContextGroups, reorderValues } from "../../utilities/sort-utils.js";
import { TypeAnnotationOption, getObjectTypeRanks, getSpreadGroups } from "../utilities/sort-utils.js";

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
  const allNodes: any[] = cleanProperties(fileContents, properties);

  // Any time there is a spread operator, we need to sort around it... moving it could cause functionality changes
  const spreadGroups: any[] = getSpreadGroups(allNodes);

  for (const nodes of spreadGroups) {
    const contextGroups = getContextGroups(nodes, comments, fileContents);

    contextGroups.forEach((element) => {
      const unsorted: any[] = element.nodes;
      const sorted: any[] = element.nodes.slice().sort((a: any, b: any) => {
        const aGroup = getSortGroupIndex(a, options);
        const bGroup = getSortGroupIndex(b, options);

        if (aGroup !== bGroup) {
          return aGroup - bGroup;
        }

        // Certain types should not be sorted against one another
        // so for these situations, we use their start index to make
        // sure we maintain their order
        if (a.type === b.type && a.type === "TSCallSignatureDeclaration") {
          return a.range[0] - b.range[0];
        }

        const aString = getString(a, fileContents);
        const bString = getString(b, fileContents);

        return compare(aString, bString);
      });

      newFileContents = reorderValues(newFileContents, element.comments, unsorted, sorted);
    });
  }

  return newFileContents;
}

function cleanProperties(fileContents: string, properties: any[]) {
  // Interface properties are read in as "property: number," where we don't want to move the commas
  return properties.map((property: any) => {
    let lastIndex = property.range[1];
    const lastCharacter = fileContents[lastIndex - 1];
    if (0 < lastIndex && (lastCharacter === "," || lastCharacter === ";")) {
      lastIndex--;
    }

    return {
      ...property,
      range: [property.range[0], lastIndex],
    };
  });
}

function getString(property: any, fileContents: string) {
  if (property.key != null) {
    if (property.key.value != null) {
      return property.key.value;
    }
    if (property.key.name != null) {
      return property.key.name;
    }
  }
  return fileContents.substring(property.range[0], property.range[1]);
}

function getSortGroupIndex(property: any, options: SortTSPropertySignaturesOptions): number {
  const ranks = getObjectTypeRanks(options.groups);

  const annotationType = property.typeAnnotation?.typeAnnotation?.type;
  if (
    property.type === "TSCallSignatureDeclaration" ||
    property.type === "TSMethodSignature" ||
    annotationType === "TSFunctionType"
  ) {
    return ranks.function;
  } else if (annotationType === "TSTypeLiteral") {
    return ranks.object;
  }
  return ranks.everything;
}
