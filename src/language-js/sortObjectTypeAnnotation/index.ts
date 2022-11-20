import { Comment } from "estree";

import { compare, getContextGroups, reorderValues } from "../../utilities/sort-utils.js";
import { TypeAnnotationOption, getObjectTypeRanks, getSpreadGroups } from "../utilities/sort-utils.js";

export interface SortObjectTypeAnnotationOptions {
  groups?: TypeAnnotationOption[];
}

export function sortObjectTypeAnnotation(
  objectTypeAnnotation: any,
  comments: Comment[],
  fileContents: string,
  options: SortObjectTypeAnnotationOptions
) {
  let newFileContents = fileContents.slice();
  const allNodes: any[] = objectTypeAnnotation.properties;

  // Any time there is a spread operator, we need to sort around it... moving it could cause functionality changes
  const spreadGroups: any[] = getSpreadGroups(allNodes);

  for (const nodes of spreadGroups) {
    const contextGroups = getContextGroups(nodes, comments, fileContents);

    contextGroups.forEach((element) => {
      const unsorted: any[] = element.nodes;
      const sorted: any[] = element.nodes.slice().sort((a, b) => {
        const aGroup = getSortGroupIndex(a, options);
        const bGroup = getSortGroupIndex(b, options);

        if (aGroup !== bGroup) {
          return aGroup - bGroup;
        }

        const aKey = getPropertyKey(a, fileContents);
        const bKey = getPropertyKey(b, fileContents);

        return compare(aKey, bKey);
      });

      newFileContents = reorderValues(newFileContents, element.comments, unsorted, sorted);
    });
  }

  return newFileContents;
}

function getPropertyKey(property: any, fileContents: string) {
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

function getSortGroupIndex(property: any, options: SortObjectTypeAnnotationOptions): number {
  const ranks = getObjectTypeRanks(options.groups);

  if (property.value != null) {
    if (property.value.type === "NullLiteralTypeAnnotation") {
      return ranks.null;
    } else if (property.value.type === "GenericTypeAnnotation" && property.value.id.name === "undefined") {
      return ranks.undefined;
    } else if (property.value.type === "FunctionTypeAnnotation" || property.value.type === "ArrowFunctionExpression") {
      return ranks.function;
    }
    // Note: We purposefully skip objects in this situation as sorting them
    // was found to be confusing
    // https://github.com/snowcoders/sortier/issues/218
  }

  return ranks.everything;
}
