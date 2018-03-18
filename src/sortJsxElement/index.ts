import { Comment } from "estree";

import { reorderValues, getContextGroups } from "../common/sort-utils";

export interface SortJsxElementOptions {
}

export function sortJsxElement(jsxElement: any, comments: Comment[], fileContents: string, options?: SortJsxElementOptions) {
  let newFileContents = fileContents.slice();

  let groupings = getContextGroups(jsxElement.openingElement.attributes, comments, fileContents);

  groupings.forEach(element => {
    let unsorted: any[] = element.nodes;
    let sorted: any[] = element.nodes.slice().sort((a, b) => {
      return a.name.name.localeCompare(b.name.name);
    });

    newFileContents = reorderValues(newFileContents, comments, unsorted, sorted);
  });

  return newFileContents;
}