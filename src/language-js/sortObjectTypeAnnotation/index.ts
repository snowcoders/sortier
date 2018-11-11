import { Comment } from "estree";

import {
  getContextGroups,
  getSpreadGroups,
  reorderValues
} from "../utilities/sort-utils";

export interface SortObjectTypeAnnotationOptions {
  groups: ("null" | "undefined" | "*" | "function" | "object")[];
}

export function sortObjectTypeAnnotation(
  objectTypeAnnotation: any,
  comments: Comment[],
  fileContents: string,
  options?: SortObjectTypeAnnotationOptions
) {
  let ensuredOptions = ensureOptions(options);
  let newFileContents = fileContents.slice();
  let allNodes: any[] = objectTypeAnnotation.properties;

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

function ensureOptions(
  options?: null | SortObjectTypeAnnotationOptions
): SortObjectTypeAnnotationOptions {
  if (options == null) {
    return {
      groups: ["undefined", "null", "*", "object", "function"]
    };
  }

  if (options.groups != null && options.groups.indexOf("*") === -1) {
    options.groups.push("*");
  }

  return {
    groups: options.groups || ["undefined", "null", "*", "object", "function"]
  };
}

function getString(property, fileContents: string) {
  return fileContents.substring(property.range[0], property.range[1]);
}

function getSortGroupIndex(
  property,
  options: SortObjectTypeAnnotationOptions
): number {
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
  if (property.value != null) {
    if (property.value.type === "NullLiteralTypeAnnotation") {
      aRank = nullRank;
    } else if (
      property.value.type === "GenericTypeAnnotation" &&
      property.value.id.name === "undefined"
    ) {
      aRank = undefinedRank;
    } else if (property.value.type === "ObjectTypeAnnotation") {
      aRank = objectRank;
    } else if (
      property.value.type === "FunctionTypeAnnotation" ||
      property.value.type === "ArrowFunctionExpression"
    ) {
      aRank = functionRank;
    }
  }

  return aRank;
}
