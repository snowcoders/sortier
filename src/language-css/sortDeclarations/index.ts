import { JSONSchemaType } from "ajv";
import {
  BaseNode,
  Comment,
  compare,
  getContextGroups,
  reorderValues,
} from "../../utilities/sort-utils.js";

export interface SortDeclarationsOptions {
  overrides: string[];
}

export const sortDeclarationsOptionsSchema: JSONSchemaType<SortDeclarationsOptions> =
  {
    type: "object",
    properties: {
      overrides: {
        type: "array",
        items: {
          type: "string",
        },
        default: [],
      },
    },
    required: [],
  };

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
  const comments: any[] = [];
  const declarations: any[] = [];

  for (const child of node.nodes) {
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

  const columnIndexToOffset: number[] = [0];
  for (let x = 0; x < fileContents.length; x++) {
    if (fileContents[x] === "\n") {
      columnIndexToOffset.push(x);
    }
  }
  // Get the range locations of all declarations
  const attributeInfos: AttrInfo[] = declarations.map((value) => {
    const startOffset =
      columnIndexToOffset[value.source.start.line - 1] +
      value.source.start.column;
    const endOffset =
      columnIndexToOffset[value.source.end.line - 1] + value.source.end.column;
    const source = fileContents.substring(startOffset, endOffset);
    const result: AttrInfo = {
      prop: value.prop,
      range: [startOffset, endOffset],
      source: source,
      value: value.value,
    };
    return result;
  });
  // Get the range locations of all declarations
  const commentInfos: Comment[] = comments.map((value) => {
    const startOffset =
      columnIndexToOffset[value.source.start.line - 1] +
      value.source.start.column;
    const endOffset =
      columnIndexToOffset[value.source.end.line - 1] +
      value.source.end.column +
      1;
    const source = fileContents.substring(startOffset, endOffset);
    const isBlock = source.trim().startsWith("/*");
    const result: Comment = {
      range: [startOffset, endOffset],
      type: isBlock ? "Block" : "Line",
    };
    return result;
  });

  const groupedAttributes = getContextGroups(
    attributeInfos,
    commentInfos,
    fileContents
  );

  // Actual sorting
  let newFileContents = fileContents;
  for (const group of groupedAttributes) {
    // Check to see if any of the variables defined are used by properties. If so, we shoudn't sort
    let shouldSkip = false;
    for (let i = 0; i < group.nodes.length; i++) {
      for (let j = i + 1; j < group.nodes.length; j++) {
        const nodeI = group.nodes[i];
        const nodej = group.nodes[j];
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

    const oldOrder = group.nodes;
    const newOrder = oldOrder.slice();
    const propertyToSortableText = new Map();
    for (const property of newOrder) {
      propertyToSortableText.set(property, getSortableText(property));
    }
    newOrder.sort((a, b) => {
      const aOverride = getOverrideIndex(a.prop, options.overrides);
      const bOverride = getOverrideIndex(b.prop, options.overrides);

      if (aOverride !== bOverride) {
        return aOverride - bOverride;
      }

      const aText = propertyToSortableText.get(a) || "";
      const bText = propertyToSortableText.get(b) || "";
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

function getSortableText(a: AttrInfo): string {
  if (a.prop != null) {
    return a.prop;
  }
  if (a.source != null) {
    return a.source;
  }

  throw new Error("Unknown object type provided");
}

function getOverrideIndex(prop: string, overrides: string[]) {
  const index = overrides.indexOf(prop);
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
