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
  return new ClassContentsSorter(
    classItems,
    comments,
    fileContents,
    options
  ).sort();
}

class ClassContentsSorter {
  private options: SortClassContentsOptionsRequired;

  constructor(
    private classItems: any[],
    private comments: any,
    private fileContents: string,
    options: SortClassContentsOptions
  ) {
    this.options = this.getValidatedOptions(options);
  }

  public sort() {
    let possibleSortableItems: Array<MinimumSortInformation | null> = this.classItems.map(
      (value): MinimumSortInformation | null => {
        switch (value.type) {
          case "ClassProperty": {
            if (value.key != null && value.key.name != null) {
              return {
                accessModifier: this.getAccessModifier(value.accessibility),
                isStatic: value.static || false,
                key: value.key.name,
                kind: this.getKindOption(value),
                range: value.range
              };
            }
            return null;
          }
          case "FunctionDeclaration": {
            if (value.id != null && value.id.name != null) {
              return {
                accessModifier: this.getAccessModifier(value.accessibility),
                isStatic: value.static || false,
                key: value.id.name,
                kind: this.getKindOption(value),
                range: value.range
              };
            }
            return null;
          }
          case "MethodDefinition": {
            if (value.key != null && value.key.name != null) {
              return {
                accessModifier: this.getAccessModifier(value.accessibility),
                isStatic: value.static || false,
                key: value.key.name,
                kind: this.getKindOption(value),
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
    let sortableItems: Array<
      MinimumSortInformation
    > = possibleSortableItems.filter(value => {
      return value != null;
    }) as any;

    let newFileContents = this.sortAlpha(
      sortableItems,
      this.comments,
      this.fileContents
    );

    return newFileContents;
  }

  private getAccessModifier(accessibility: string) {
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

  private getKindOption(node: any) {
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

  private sortAlpha(
    classItems: MinimumSortInformation[],
    comments: any,
    fileContents: string
  ) {
    let sortedTypes = classItems.slice();
    sortedTypes.sort((a, b) => {
      let groupComparison = this.compareGroups(a, b);
      if (groupComparison !== 0) {
        return groupComparison;
      }

      let comparison = a.key.localeCompare(b.key);
      if (this.options.isAscending) {
        return comparison;
      } else {
        return comparison * -1;
      }
    });

    return reorderValues(fileContents, comments, classItems, sortedTypes);
  }

  private compareGroups(
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

  private getValidatedOptions(
    partialOptions: SortClassContentsOptions
  ): SortClassContentsOptionsRequired {
    return {
      isAscending:
        partialOptions.isAscending == null ? true : partialOptions.isAscending,
      order: partialOptions.order || "alpha",
      overrides: partialOptions.overrides || ["*"]
    };
  }
}
