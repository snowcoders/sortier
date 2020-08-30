import {
  BaseNode,
  Comment,
  compare,
  getContextGroups,
  reorderValues,
} from "../../utilities/sort-utils";

export interface SortDeclarationsOptions {
  overrides: string[];
}

interface AttrInfo extends BaseNode {
  prop: string;
  source: string;
  value: string;
}

export function sortDeclarations(
  node: any,
  fileContents: string,
  options: SortDeclarationsOptions
) {
  let comments: any[] = [];
  let declarations: any[] = [];

  for (let child of node.nodes) {
    switch (child.type) {
      case "comment":
        comments.push(child);
        break;
      case "decl":
        declarations.push(child);
        break;
    }
  }

  if (declarations.length === 0) {
    return fileContents;
  }

  let columnIndexToOffset: number[] = [0];
  for (let x = 0; x < fileContents.length; x++) {
    if (fileContents[x] === "\n") {
      columnIndexToOffset.push(x);
    }
  }
  // Get the range locations of all declarations
  let attributeInfos: AttrInfo[] = declarations.map((value) => {
    let startOffset =
      columnIndexToOffset[value.source.start.line - 1] +
      value.source.start.column;
    let endOffset =
      columnIndexToOffset[value.source.end.line - 1] + value.source.end.column;
    let source = fileContents.substring(startOffset, endOffset);
    let result: AttrInfo = {
      prop: value.prop,
      range: [startOffset, endOffset],
      source: source,
      value: value.value,
    };
    return result;
  });
  // Get the range locations of all declarations
  let commentInfos: Comment[] = comments.map((value) => {
    let startOffset =
      columnIndexToOffset[value.source.start.line - 1] +
      value.source.start.column;
    let endOffset =
      columnIndexToOffset[value.source.end.line - 1] +
      value.source.end.column +
      1;
    let source = fileContents.substring(startOffset, endOffset);
    let isBlock = source.trim().startsWith("/*");
    let result: Comment = {
      range: [startOffset, endOffset],
      type: isBlock ? "Block" : "Line",
    };
    return result;
  });

  // TODO move getContextGroups up into the root utilities
  let groupedAttributes = getContextGroups(
    attributeInfos,
    commentInfos,
    fileContents
  );

  // Actual sorting
  let newFileContents = fileContents;
  for (let group of groupedAttributes) {
    // Check to see if any of the variables defined are used by properties. If so, we shoudn't sort
    let shouldSkip = false;
    for (let i = 0; i < group.nodes.length; i++) {
      for (let j = i + 1; j < group.nodes.length; j++) {
        let nodeI = group.nodes[i];
        let nodej = group.nodes[j];
        if (nodej.value.indexOf(nodeI.prop) !== -1) {
          shouldSkip = true;
          break;
        }
      }
      if (shouldSkip) {
        break;
      }
    }
    if (shouldSkip) {
      continue;
    }

    let oldOrder = group.nodes;
    let newOrder = oldOrder.slice();
    let propertyToSortableText = new Map();
    for (let property of newOrder) {
      propertyToSortableText.set(property, getSortableText(property));
    }
    newOrder.sort((a, b) => {
      let aOverride = getOverrideIndex(a.prop, options.overrides);
      let bOverride = getOverrideIndex(b.prop, options.overrides);

      if (aOverride !== bOverride) {
        return aOverride - bOverride;
      }

      let aText = propertyToSortableText.get(a) || "";
      let bText = propertyToSortableText.get(b) || "";
      return compare(aText, bText);
    });

    newFileContents = reorderValues(
      newFileContents,
      group.comments,
      oldOrder,
      newOrder
    );
  }
  return newFileContents;
}

function getSortableText(a): string {
  if (a.prop != null) {
    return a.prop;
  }
  if (a.source != null) {
    return a.source;
  }

  throw new Error("Unknown object type provided");
}

function getOverrideIndex(prop: string, overrides: string[]) {
  let index = overrides.indexOf(prop);
  let wildcard = overrides.indexOf("*");
  if (wildcard === -1) {
    wildcard = overrides.length;
  }
  if (index === -1) {
    return wildcard;
  } else {
    return index;
  }
}
