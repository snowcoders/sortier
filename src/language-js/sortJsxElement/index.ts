import { Comment } from "estree";

import {
  getContextGroups,
  getSpreadGroups,
  reorderValues
} from "../utilities/sort-utils";

export interface SortJsxElementOptions {}

export function sortJsxElement(
  jsxElement: any,
  comments: Comment[],
  fileContents: string,
  options?: SortJsxElementOptions
) {
  let newFileContents = fileContents.slice();

  let allNodes = jsxElement.openingElement.attributes;

  // Any time there is a spread operator, we need to sort around it... moving it could cause functionality changes
  let spreadGroups: any[] = getSpreadGroups(allNodes);

  for (let nodes of spreadGroups) {
    let groupings = getContextGroups(nodes, comments, fileContents);

    groupings.forEach(element => {
      let unsorted: any[] = element.nodes;
      let sorted: any[] = element.nodes.slice().sort((a, b) => {
        return a.name.name.localeCompare(b.name.name);
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
