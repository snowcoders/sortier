import { Comment } from "estree";

import { getContextGroups, reorderValues } from "../../utilities/sort-utils";
import {
  getObjectTypeRanks,
  getSpreadGroups,
  TypeAnnotationOption
} from "../utilities/sort-utils";

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
  let allNodes: any[] = objectTypeAnnotation.properties;

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

function getString(property, fileContents: string) {
  return fileContents.substring(property.range[0], property.range[1]);
}

function getSortGroupIndex(
  property,
  options: SortObjectTypeAnnotationOptions
): number {
  let ranks = getObjectTypeRanks(options.groups);

  if (property.value != null) {
    if (property.value.type === "NullLiteralTypeAnnotation") {
      return ranks.null;
    } else if (
      property.value.type === "GenericTypeAnnotation" &&
      property.value.id.name === "undefined"
    ) {
      return ranks.undefined;
    } else if (
      property.value.type === "FunctionTypeAnnotation" ||
      property.value.type === "ArrowFunctionExpression"
    ) {
      return ranks.function;
    }
    // Note: We purposefully skip objects in this situation as sorting them
    // was found to be confusing
    // https://github.com/snowcoders/sortier/issues/218
  }

  return ranks.everything;
}
