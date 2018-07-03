import { Comment } from "estree";

import { getContextGroups, getSpreadGroups, reorderValues } from "../common/sort-utils";

export interface SortTSPropertySignaturesOptions {
  groups: ("null" | "undefined" | "*" | "function" | "object")[],
}

export function sortTSPropertySignatures(properties: any, comments: Comment[], fileContents: string, options?: SortTSPropertySignaturesOptions) {
  let ensuredOptions = ensureOptions(options);
  let newFileContents = fileContents.slice();
  let allNodes: any[] = cleanProperties(fileContents, properties);

  // Any time there is a spread operator, we need to sort around it... moving it could cause functionality changes
  let spreadGroups: any[] = getSpreadGroups(allNodes);

  for (let nodes of spreadGroups) {
    let contextGroups = getContextGroups(nodes, comments, fileContents);

    contextGroups.forEach(element => {
      let unsorted: any[] = element.nodes;
      let sorted: any[] = element.nodes.slice().sort((a, b) => {
        let aGroup = getSortGroupIndex(a, ensuredOptions);
        let bGroup = getSortGroupIndex(b, ensuredOptions);

        if (aGroup != bGroup) {
          return aGroup - bGroup;
        }

        let aString = getString(a, fileContents);
        let bString = getString(b, fileContents);

        return aString.localeCompare(bString);
      });

      newFileContents = reorderValues(newFileContents, comments, unsorted, sorted);
    });
  }

  return newFileContents;
}

function ensureOptions(options?: SortTSPropertySignaturesOptions | null): SortTSPropertySignaturesOptions {
  if (options == null) {
    return {
      groups: ["undefined", "null", "*", "object", "function"],
    };
  }

  if (options.groups != null && options.groups.indexOf("*") === -1) {
    options.groups.push("*");
  }

  return {
    groups: options.groups || ["undefined", "null", "*", "object", "function"],
  };
}

function cleanProperties(fileContents: string, properties: any[]) {
  // Interface properties are read in as "property: number," where we don't want to move the commas
  return properties.map((property: any) => {
    let lastIndex = property.range[1];
    if (0 < lastIndex &&
      fileContents[lastIndex - 1] === ',') {
      lastIndex--;
    }

    return {
      ...property,
      range: [
        property.range[0], lastIndex
      ]
    }
  });
}

function getString(property, fileContents: string) {
  return fileContents.substring(property.range[0], property.range[1]);
}

function getSortGroupIndex(property, options: SortTSPropertySignaturesOptions): number {
  // Sort them by name
  let everythingRank = options.groups.indexOf("*");
  if (everythingRank === -1) {
    everythingRank = 0;
  }
  let nullRank = options.groups.indexOf("null");
  if (nullRank === -1) {
    nullRank = everythingRank;
  }
  let undefinedRank = options.groups.indexOf("undefined");
  if (undefinedRank === -1) {
    undefinedRank = everythingRank;
  }
  let functionRank = options.groups.indexOf("function");
  if (functionRank === -1) {
    functionRank = everythingRank;
  }
  let objectRank = options.groups.indexOf("object");
  if (objectRank === -1) {
    objectRank = everythingRank;
  }

  let aRank = everythingRank;
  if (property.type === "TSMethodSignature" || property.typeAnnotation.typeAnnotation.type === "TSFunctionType") {
    aRank = functionRank;
  } else if (property.typeAnnotation.typeAnnotation.type === "TSTypeLiteral") {
    aRank = objectRank;
  }

  return aRank;
}