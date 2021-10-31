import { ArrayUtils } from "../../utilities/array-utils.js";
import {
  BaseNode,
  compare,
  reorderValues,
} from "../../utilities/sort-utils.js";

export type SortClassContentsOptions =
  Partial<SortClassContentsOptionsRequired>;

type SortClassContentsOptionsRequired = {
  isAscending: boolean;
  order: "alpha" | "usage";
  // Overrides for the order within each group of static methods, properties, methods and access modifiers
  overrides: Array<string>;
};

enum AccessibilityOption {
  Public,
  Protected,
  Private,
}
enum KindOption {
  Property,
  Constructor,
  Method,
}

interface MinimumSortInformation extends BaseNode {
  accessModifier: AccessibilityOption;
  isStatic: boolean;
  key: string;
  kind: KindOption;
  overrideIndex: number;
}

export function sortClassContents(
  className: undefined | string,
  classItems: any[],
  comments: any,
  fileContents: string,
  options: SortClassContentsOptions
): string {
  return new ClassContentsSorter(
    className || "",
    classItems,
    comments,
    fileContents,
    options
  ).sort();
}

class ClassContentsSorter {
  private options: SortClassContentsOptionsRequired;

  constructor(
    private className: string,
    private classItems: any[],
    private comments: any,
    private fileContents: string,
    options: SortClassContentsOptions
  ) {
    this.options = this.getValidatedOptions(options);
  }

  public sort() {
    const possibleSortableItems: Array<MinimumSortInformation | null> =
      this.classItems.map((value): MinimumSortInformation | null => {
        switch (value.type) {
          case "ClassProperty":
          case "MethodDefinition":
          case "PropertyDefinition": {
            const key = value?.key?.name;
            if (key != null) {
              return {
                accessModifier: this.getAccessModifier(value.accessibility),
                isStatic: value.static || false,
                key: key,
                kind: this.getKindOption(value),
                overrideIndex: this.getOverrideIndex(value),
                range: value.range,
              };
            }
            return null;
          }
          default:
            return null;
        }
      });
    const sortableItems: Array<MinimumSortInformation> =
      possibleSortableItems.filter((value) => {
        return value != null;
      }) as any;

    const newFileContents = this.sortItems(
      sortableItems,
      this.comments,
      this.fileContents
    );

    return newFileContents;
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
      overrides: overrides,
    };
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

  private getOverrideIndex(node: any) {
    const itemsToSearch = [node.key.name];

    let index = -1;
    for (const item of itemsToSearch) {
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
    const isUsage = this.options.order === "usage";
    const callOrder = this.getClassItemOrder();

    const sortedTypes = classItems.slice();
    sortedTypes.sort((a, b) => {
      const groupComparison = this.compareGroups(a, b);
      if (groupComparison !== 0) {
        return groupComparison;
      }

      const overrideComparison = this.compareOverrides(a, b);
      if (overrideComparison !== 0) {
        return overrideComparison;
      }

      let callComparison = 0;
      const isAStaticProperty = a.kind === KindOption.Property;
      const isBStaticProperty = b.kind === KindOption.Property;
      if (isUsage || (isAStaticProperty && isBStaticProperty)) {
        callComparison = this.compareMethodCallers(a, b, callOrder);
        if (callComparison !== 0) {
          return callComparison;
        }
      }

      const stringComparison = compare(a.key, b.key);
      if (isUsage || this.options.isAscending) {
        return stringComparison;
      } else {
        return -1 * stringComparison;
      }
    });

    return reorderValues(fileContents, comments, classItems, sortedTypes);
  }

  private getClassItemOrder() {
    // Split the list into static properties and everything else as static
    // properties cause build failures when depending on one another out of order
    const properties: any[] = [];
    const everythingElse: any[] = [];
    for (const classItem of this.classItems) {
      if (this.getKindOption(classItem) === KindOption.Property) {
        properties.push(classItem);
      } else {
        everythingElse.push(classItem);
      }
    }

    // Sort both arrays
    const comparisonFunction = (a: any, b: any) => {
      return compare(a.key.name, b.key.name);
    };
    properties.sort(comparisonFunction);
    everythingElse.sort(comparisonFunction);

    // Determine the order of the items
    const staticOrder = this.orderItems(properties, true, true);
    const everythingElseOrder = this.orderItems(everythingElse, false, false);

    // Merge and dedupe
    const totalCallOrder = [...staticOrder, ...everythingElseOrder];
    ArrayUtils.dedupe(totalCallOrder);
    return totalCallOrder;
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

  private getKindOption(node: any) {
    if (node.kind === "constructor") {
      return KindOption.Constructor;
    }
    if (node.type === "ClassProperty" || node.type === "PropertyDefinition") {
      if (node.value != null && node.value.type === "ArrowFunctionExpression") {
        return KindOption.Method;
      } else {
        return KindOption.Property;
      }
    }
    return KindOption.Method;
  }

  private orderItems(
    sortedClassItems: any[],
    isSiblingSort: boolean,
    isProperties: boolean
  ): string[] {
    // Storage of the overall call order as read from top to bottom, left to right
    const overallCallOrder: string[] = [];
    // Map of method names to parent information
    const keyToNode = new Map<string, Set<string>>();

    // Figure out what parents which methods have and break any cycles
    for (const classItem of sortedClassItems) {
      const methodName = classItem.key.name;
      const calls = this.getCalleeOrder([classItem]);
      if (isSiblingSort) {
        calls.sort();
        if (this.options.order === "alpha" && !this.options.isAscending) {
          calls.reverse();
        }
      }
      overallCallOrder.push(...calls);
      for (const call of calls) {
        if (call === methodName) {
          continue;
        }
        const parents = keyToNode.get(call);
        if (parents == null) {
          keyToNode.set(call, new Set([methodName]));
        } else {
          let addToParentList = true;
          const ancestorStack = [methodName];
          while (addToParentList && ancestorStack.length !== 0) {
            const parents = keyToNode.get(ancestorStack.pop());
            if (parents == null) {
              continue;
            }

            for (const a of parents) {
              if (call === a) {
                addToParentList = false;
                break;
              }
              ancestorStack.push(a);
            }
          }
          if (addToParentList) {
            parents.add(methodName);
          }
        }
      }

      // Create the parent node
      const parentNode = keyToNode.get(methodName);
      if (parentNode == null) {
        keyToNode.set(methodName, new Set());
      }
    }

    //dedupe the overallCallOrder array
    ArrayUtils.dedupe(overallCallOrder);

    // Now go through all nodes, remove the root nodes and push them into the resulting
    // call order array in order based on overallCallOrder
    const resultingCallOrder: string[] = [];

    while (keyToNode.size !== 0) {
      const nextGroup: string[] = [];
      for (const keyNodePair of keyToNode) {
        if (keyNodePair[1].size === 0) {
          nextGroup.push(keyNodePair[0]);
        }
      }

      nextGroup.sort((a, b) => {
        const aIndex = overallCallOrder.indexOf(a);
        const bIndex = overallCallOrder.indexOf(b);
        return aIndex - bIndex;
      });

      if (!isProperties && this.options.isAscending) {
        resultingCallOrder.push(...nextGroup);
      } else {
        resultingCallOrder.unshift(...nextGroup);
      }

      for (const key of nextGroup) {
        keyToNode.delete(key);

        for (const parents of keyToNode.values()) {
          parents.delete(key);
        }
      }
    }

    return resultingCallOrder;
  }

  private getCalleeOrder(nodes: any[]) {
    const memberExpressionOrder: string[] = [];
    for (const node of nodes) {
      if (node == null) {
        continue;
      }
      for (const property in node) {
        if (property === "type" || property === "loc" || property === "range") {
          continue;
        }
        const value = node[property];
        if (value == null) {
          continue;
        } else if (
          value != null &&
          value.object != null &&
          (value.object.type === "ThisExpression" ||
            value.object.name === this.className) &&
          value.type === "MemberExpression" &&
          value.property.name != null
        ) {
          memberExpressionOrder.push(value.property.name);
        } else if (value.type != null) {
          memberExpressionOrder.push(...this.getCalleeOrder([value]));
        } else if (Array.isArray(value)) {
          memberExpressionOrder.push(...this.getCalleeOrder(value));
        }
      }
    }

    return memberExpressionOrder;
  }
}
