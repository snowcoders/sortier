import { Comment } from "estree";

import {
  compare,
  getContextGroups,
  reorderValues,
} from "../../utilities/sort-utils";
import { getSpreadGroups } from "../utilities/sort-utils";

// Left in for consistency with other sort functions
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SortJsxElementOptions {}

interface JsxAttribute {
  name: {
    name: string;
  };
  range?: [number, number];
  type: string;
}

export function sortJsxElement(
  jsxElement: any,
  comments: Comment[],
  fileContents: string,
  // Left in for consistency with other sort functions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: SortJsxElementOptions
) {
  if (jsxElement.openingElement == null) {
    // Fragment element
    return fileContents;
  }

  let newFileContents = fileContents.slice();

  const allNodes: JsxAttribute[] = jsxElement.openingElement.attributes;

  // Any time there is a spread operator, we need to sort around it... moving it could cause functionality changes
  const spreadGroups = getSpreadGroups(allNodes);

  for (const nodes of spreadGroups) {
    const groupings = getContextGroups(nodes, comments, fileContents);

    groupings.forEach((element) => {
      const unsorted = element.nodes;
      const sorted = element.nodes.slice().sort((a, b) => {
        return compare(a.name.name, b.name.name);
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
