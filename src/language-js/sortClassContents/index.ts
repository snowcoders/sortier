import {
  FunctionDeclaration,
  FunctionExpression,
  MethodDefinition,
  Node
} from "estree";
import {
  getContextGroups,
  MinimumTypeInformation,
  reorderValues
} from "../utilities/sort-utils";

export type SortClassContentsOptions = Partial<
  SortClassContentsOptionsRequired
>;

type SortClassContentsOptionsRequired = {
  isAscending: boolean;
  order: "alpha" | "usage";
  overrides: Array<string>;
};

type SortInformation = {
  key: string;
};

interface MinimumSortInformation extends MinimumTypeInformation {
  key: string;
}

export function sortClassContents(
  classItems: any[],
  comments: any,
  fileContents: string,
  options: SortClassContentsOptions
): string {
  let allOptions = getValidatedOptions(options);

  let sortableItems: Array<MinimumSortInformation | null> = classItems.map(
    value => {
      switch (value.type) {
        case "FunctionDeclaration":
        case "FunctionExpression": {
          if (value.id != null && value.id.name != null) {
            return { key: value.id.name, range: value.range };
          }
        }
        case "MethodDefinition": {
          // Typescript
          if (value.key != null && value.key.name != null) {
            return { key: value.key.name, range: value.range };
          }
        }
        default:
          return null;
      }
    }
  );
  let sortableItems2: Array<MinimumSortInformation> = sortableItems.filter(
    value => {
      return value != null;
    }
  ) as any;

  let newFileContents = sortAlpha(sortableItems2, comments, fileContents);

  return newFileContents;
}

function sortAlpha(
  classItems: MinimumSortInformation[],
  comments: any,
  fileContents: string
) {
  let sortedTypes = classItems.slice();
  sortedTypes.sort((a, b) => {
    return a.key.localeCompare(b.key);
  });

  return reorderValues(fileContents, comments, classItems, sortedTypes);
}

function getValidatedOptions(
  partialOptions: SortClassContentsOptions
): SortClassContentsOptionsRequired {
  return {
    isAscending: partialOptions.isAscending || true,
    order: partialOptions.order || "alpha",
    overrides: partialOptions.overrides || ["*"]
  };
}
