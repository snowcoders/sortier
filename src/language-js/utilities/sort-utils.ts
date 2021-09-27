import { ArrayUtils } from "../../utilities/array-utils.js";

import { BaseNode } from "../../utilities/sort-utils.js";

export interface Node extends BaseNode {
  type: string;
}

export type TypeAnnotationOption =
  | "*"
  | "function"
  | "null"
  | "object"
  | "undefined";

type RankMap = {
  everything: number;
  function: number;
  null: number;
  object: number;
  undefined: number;
};

const defaultObjectTypeOrder: TypeAnnotationOption[] = [
  "undefined",
  "null",
  "*",
  "function",
];
let lastCalculatedRankOptions: undefined | TypeAnnotationOption[] = undefined;
let lastCalculatedRankMap: undefined | RankMap = undefined;
export function getObjectTypeRanks(options?: TypeAnnotationOption[]): RankMap {
  // Use defaults if passed undefined
  options = options || defaultObjectTypeOrder;

  // Figure out if we can use the cache and recache if we can't
  if (
    lastCalculatedRankOptions != null &&
    lastCalculatedRankMap != null &&
    ArrayUtils.isEqual(lastCalculatedRankOptions, options)
  ) {
    return lastCalculatedRankMap;
  } else {
    lastCalculatedRankOptions = options;
  }

  // Determine the map
  let everythingRank = options.indexOf("*");
  if (everythingRank === -1) {
    everythingRank = options.length;
  }
  let nullRank = options.indexOf("null");
  if (nullRank === -1) {
    nullRank = everythingRank;
  }
  let undefinedRank = options.indexOf("undefined");
  if (undefinedRank === -1) {
    undefinedRank = everythingRank;
  }
  let objectRank = options.indexOf("object");
  if (objectRank === -1) {
    objectRank = everythingRank;
  }
  let functionRank = options.indexOf("function");
  if (functionRank === -1) {
    functionRank = everythingRank;
  }

  lastCalculatedRankMap = {
    everything: everythingRank,
    function: functionRank,
    null: nullRank,
    object: objectRank,
    undefined: undefinedRank,
  };
  return lastCalculatedRankMap;
}

export function getSpreadGroups<T extends Node>(allNodes: T[]) {
  // Any time there is a spread operator, we need to sort around it... moving it could cause functionality changes
  const spreadGroups: T[][] = [];
  let currentStart = 0;
  for (let x = 0; x < allNodes.length; x++) {
    if (
      allNodes[x].type.includes("Spread") ||
      allNodes[x].type.includes("Rest")
    ) {
      if (currentStart !== x) {
        spreadGroups.push(allNodes.slice(currentStart, x));
      }
      currentStart = x + 1;
    }
  }
  if (currentStart !== allNodes.length) {
    spreadGroups.push(allNodes.slice(currentStart));
  }

  return spreadGroups;
}
