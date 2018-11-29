import { isArray } from "util";
import { MinimumTypeInformation, reorderValues } from "../utilities/sort-utils";

export type SortClassContentsOptions = Partial<
  SortClassContentsOptionsRequired
>;

type SortClassContentsOptionsRequired = {
  isAscending: boolean;
  order: "alpha" | "usage";
  // Overrides for the order within each group of static methods, properties, methods and access modifiers
  overrides: Array<string>;
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
  overrideIndex: number;
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
                overrideIndex: this.getOverrideIndex(value),
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
                overrideIndex: this.getOverrideIndex(value),
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

    let newFileContents = this.sortItems(
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

  private getOverrideIndex(node: any) {
    let itemsToSearch = [node.key.name];

    let index = -1;
    for (let item of itemsToSearch) {
      index = this.options.overrides.indexOf(item);
      if (index !== -1) {
        return index;
      }
    }

    return this.options.overrides.indexOf("*");
  }

  private sortItems(
    classItems: MinimumSortInformation[],
    comments: any,
    fileContents: string
  ) {
    let callOrder: null | string[] = null;
    if (this.options.order === "usage") {
      callOrder = this.generateCallOrder();

      //dedupe the callorder array
      for (var i = 0; i < callOrder.length; i++) {
        for (var j = i + 1; j < callOrder.length; j++) {
          if (callOrder[i] == callOrder[j]) {
            callOrder.splice(j, 1);
          }
        }
      }
    }

    let sortedTypes = classItems.slice();
    sortedTypes.sort((a, b) => {
      let groupComparison = this.compareGroups(a, b);
      if (groupComparison !== 0) {
        return groupComparison;
      }

      let overrideComparison = this.compareOverrides(a, b);
      if (overrideComparison !== 0) {
        return overrideComparison;
      }

      let comparison = 0;
      if (callOrder != null) {
        comparison = this.compareMethodCallers(a, b, callOrder);
      }
      if (comparison === 0) {
        comparison = a.key.localeCompare(b.key);
      }
      if (this.options.isAscending) {
        return comparison;
      } else {
        return -1 * comparison;
      }
    });

    return reorderValues(fileContents, comments, classItems, sortedTypes);
  }

  private generateCallOrder(itemsToIterate: any = this.classItems) {
    let memberExpressionOrder: string[] = [];
    for (let classItem of itemsToIterate) {
      if (classItem == null) {
        continue;
      }
      for (let property in classItem) {
        let value = classItem[property];
        if (value == null) {
          continue;
        }
        if (value.type != null) {
          memberExpressionOrder.push(...this.generateCallOrder([value]));
        }
        if (isArray(value)) {
          memberExpressionOrder.push(...this.generateCallOrder(value));
        }
      }
      if (
        classItem.expression != null &&
        classItem.expression.callee != null &&
        classItem.expression.callee.object != null &&
        classItem.expression.callee.object.type === "ThisExpression" &&
        classItem.expression.callee.type === "MemberExpression" &&
        classItem.expression.callee.property.name != null
      ) {
        memberExpressionOrder.push(classItem.expression.callee.property.name);
      }
    }

    return memberExpressionOrder;
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

  private compareOverrides(
    a: MinimumSortInformation,
    b: MinimumSortInformation
  ): number {
    return a.overrideIndex - b.overrideIndex;
  }

  private compareMethodCallers(
    a: MinimumSortInformation,
    b: MinimumSortInformation,
    methodToCallers: string[]
  ) {
    return methodToCallers.indexOf(a.key) - methodToCallers.indexOf(b.key);
  }

  private getValidatedOptions(
    partialOptions: SortClassContentsOptions
  ): SortClassContentsOptionsRequired {
    let overrides = ["*"];
    if (partialOptions.overrides != null) {
      overrides = partialOptions.overrides;
      if (overrides.indexOf("*") === -1) {
        overrides = overrides.slice();
        overrides.push("*");
      }
    }

    return {
      isAscending:
        partialOptions.isAscending == null ? true : partialOptions.isAscending,
      order: partialOptions.order || "alpha",
      overrides: overrides
    };
  }
}
