import { Comment } from "estree";

import { getContextGroups, reorderValues } from "../../utilities/sort-utils";
import { getSpreadGroups } from "../utilities/sort-utils";

export interface SortJsxElementOptions {}

interface JsxAttribute {
  range?: [number, number];
  type: string;
  name: {
    name: string;
  };
}

export function sortJsxElement(
  jsxElement: any,
  comments: Comment[],
  fileContents: string,
  options?: SortJsxElementOptions
) {
  let newFileContents = fileContents.slice();

  let allNodes: JsxAttribute[] = jsxElement.openingElement.attributes;

  // Any time there is a spread operator, we need to sort around it... moving it could cause functionality changes
  let spreadGroups = getSpreadGroups(allNodes);

  for (let nodes of spreadGroups) {
    let groupings = getContextGroups(nodes, comments, fileContents);

    groupings.forEach(element => {
      let unsorted = element.nodes;
      let sorted = element.nodes.slice().sort((a, b) => {
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
