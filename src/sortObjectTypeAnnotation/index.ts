import { Comment } from "estree";

import { getContextGroups, reorderValues } from "../common/sort-utils";

export interface SortObjectTypeAnnotationOptions {
  groups: ["functions", "*"],
}

export function sortObjectTypeAnnotation(objectTypeAnnotation: any, comments: Comment[], fileContents: string, options?: SortObjectTypeAnnotationOptions) {
  let ensuredOptions = ensureOptions(options);
  let newFileContents = fileContents.slice();

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
      groups: ["functions", "*"]
    };
  }

  if (options.groups != null && options.groups.indexOf("*") === -1) {
    options.groups.push("*");
  }

  return {
    groups: options.groups || ["functions", "*"],
  };
}

function getSortGroupIndex(property, options: SortObjectTypeAnnotationOptions): number {
  let functionIndex = options.groups.indexOf("functions");
  let everythingIndex = options.groups.indexOf("*");

  if (property.value.type === "FunctionTypeAnnotation") {
    return functionIndex;
  } else {
    return everythingIndex;
  }
}