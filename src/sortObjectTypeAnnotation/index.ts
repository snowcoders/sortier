import { Comment } from "estree";

import { getContextGroups, reorderValues } from "../common/sort-utils";

export interface SortObjectTypeAnnotationOptions {
  groups: ("null" | "undefined" | "*" | "function" | "object")[],
}

export function sortObjectTypeAnnotation(objectTypeAnnotation: any, comments: Comment[], fileContents: string, options?: SortObjectTypeAnnotationOptions) {
  let ensuredOptions = ensureOptions(options);
  let newFileContents = fileContents.slice();

  // TODO need to include spread properties in contextBreaks
  let groupings = getContextGroups(objectTypeAnnotation.properties, comments, fileContents);

  groupings.forEach(element => {
    let unsorted: any[] = element.nodes;
    let sorted: any[] = element.nodes.slice().sort((a, b) => {
      let aGroup = getSortGroupIndex(a, ensuredOptions);
      let bGroup = getSortGroupIndex(b, ensuredOptions);

      if (aGroup != bGroup) {
        return aGroup - bGroup;
      }

      return a.key.name.localeCompare(b.key.name);
    });

    newFileContents = reorderValues(newFileContents, comments, unsorted, sorted);
  });

  return newFileContents;
}

function ensureOptions(options?: SortObjectTypeAnnotationOptions | null): SortObjectTypeAnnotationOptions {
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

function getSortGroupIndex(property, options: SortObjectTypeAnnotationOptions): number {
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
    }
    else if (property.value.type === "GenericTypeAnnotation" && property.value.id.name === "undefined") {
      aRank = undefinedRank;
    }
    else if (property.value.type === "ObjectTypeAnnotation") {
      aRank = objectRank;
    }
    else if (property.value.type === "FunctionTypeAnnotation") {
      aRank = functionRank;
    }
  }

  return aRank;
}