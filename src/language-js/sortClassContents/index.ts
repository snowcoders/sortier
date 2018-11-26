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

enum AccessibilityOption {
  Public,
  Protected,
  Private
}
enum KindOption {
  Property,
  Constructor,
  Method
}

interface MinimumSortInformation extends MinimumTypeInformation {
  accessModifier: AccessibilityOption;
  isStatic: boolean;
  key: string;
  kind: KindOption;
}

export function sortClassContents(
  classItems: any[],
  comments: any,
  fileContents: string,
  options: SortClassContentsOptions
): string {
  let allOptions = getValidatedOptions(options);

  let sortableItems: Array<MinimumSortInformation | null> = classItems.map(
    (value): MinimumSortInformation | null => {
      switch (value.type) {
        case "ClassProperty": {
          if (value.key != null && value.key.name != null) {
            return {
              accessModifier: getAccessModifier(value.accessibility),
              isStatic: value.static || false,
              key: value.key.name,
              kind: getKindOption(value),
              range: value.range
            };
          }
          return null;
        }
        case "FunctionDeclaration": {
          if (value.id != null && value.id.name != null) {
            return {
              accessModifier: getAccessModifier(value.accessibility),
              isStatic: value.static || false,
              key: value.id.name,
              kind: getKindOption(value),
              range: value.range
            };
          }
          return null;
        }
        case "MethodDefinition": {
          if (value.key != null && value.key.name != null) {
            return {
              accessModifier: getAccessModifier(value.accessibility),
              isStatic: value.static || false,
              key: value.key.name,
              kind: getKindOption(value),
              range: value.range
            };
          }
          return null;
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

function getAccessModifier(accessibility: string) {
  switch (accessibility) {
    case "private":
      return AccessibilityOption.Private;
    case "protected":
      return AccessibilityOption.Protected;
    case "public":
      return AccessibilityOption.Public;
    default:
      return AccessibilityOption.Public;
  }
}

function getKindOption(node: any) {
  if (node.kind === "constructor") {
    return KindOption.Constructor;
  }
  if (node.type === "ClassProperty") {
    if (node.value != null && node.value.type === "ArrowFunctionExpression") {
      return KindOption.Method;
    } else {
      return KindOption.Property;
    }
  }
  return KindOption.Method;
}

function sortAlpha(
  classItems: MinimumSortInformation[],
  comments: any,
  fileContents: string
) {
  let sortedTypes = classItems.slice();
  sortedTypes.sort((a, b) => {
    let groupComparison = compareGroups(a, b);
    if (groupComparison !== 0) {
      return groupComparison;
    }
    return a.key.localeCompare(b.key);
  });

  return reorderValues(fileContents, comments, classItems, sortedTypes);
}

function compareGroups(
  a: MinimumSortInformation,
  b: MinimumSortInformation
): number {
  // Static methods
  if (a.isStatic !== b.isStatic) {
    if (a.isStatic) {
      return -1;
    } else {
      return 1;
    }
  }

  // Kinds
  if (a.kind !== b.kind) {
    return a.kind - b.kind;
  }

  // Access modifiers
  if (a.accessModifier !== b.accessModifier) {
    return a.accessModifier - b.accessModifier;
  }

  return 0;
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
