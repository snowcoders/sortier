import { isArray } from "util";
import { ArrayUtils } from "../../utilities/array-utils";
import { BaseNode, compare, reorderValues } from "../../utilities/sort-utils";

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
    let isUsage = this.options.order === "usage";
    let callOrder = this.getClassItemOrder();

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

      let callComparison = 0;
      let isAStaticProperty = a.kind === KindOption.Property;
      let isBStaticProperty = b.kind === KindOption.Property;
      if (isUsage || (isAStaticProperty && isBStaticProperty)) {
        callComparison = this.compareMethodCallers(a, b, callOrder);
        if (callComparison !== 0) {
          return callComparison;
        }
      }

      let stringComparison = compare(a.key, b.key);
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
    let properties: any[] = [];
    let everythingElse: any[] = [];
    for (let classItem of this.classItems) {
      if (this.getKindOption(classItem) === KindOption.Property) {
        properties.push(classItem);
      } else {
        everythingElse.push(classItem);
      }
    }

    // Sort both arrays
    let comparisonFunction = (a, b) => {
      return compare(a.key.name, b.key.name);
    };
    properties.sort(comparisonFunction);
    everythingElse.sort(comparisonFunction);

    // Determine the order of the items
    let staticOrder = this.orderItems(properties, true, true);
    let everythingElseOrder = this.orderItems(everythingElse, false, false);

    // Merge and dedupe
    let totalCallOrder = [...staticOrder, ...everythingElseOrder];
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
    if (node.type === "ClassProperty") {
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
    let overallCallOrder: string[] = [];
    // Map of method names to parent information
    let keyToNode = new Map<string, Set<string>>();

    // Figure out what parents which methods have and break any cycles
    for (let classItem of sortedClassItems) {
      let methodName = classItem.key.name;
      let calls = this.getCalleeOrder([classItem]);
      if (isSiblingSort) {
        calls.sort();
        if (this.options.order === "alpha" && !this.options.isAscending) {
          calls.reverse();
        }
      }
      overallCallOrder.push(...calls);
      for (let call of calls) {
        if (call === methodName) {
          continue;
        }
        let parents = keyToNode.get(call);
        if (parents == null) {
          keyToNode.set(call, new Set([methodName]));
        } else {
          let addToParentList = true;
          let ancestorStack = [methodName];
          while (addToParentList && ancestorStack.length !== 0) {
            let parents = keyToNode.get(ancestorStack.pop());
            if (parents == null) {
              continue;
            }

            for (let a of parents) {
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
      let parentNode = keyToNode.get(methodName);
      if (parentNode == null) {
        keyToNode.set(methodName, new Set());
      }
    }

    //dedupe the overallCallOrder array
    ArrayUtils.dedupe(overallCallOrder);

    // Now go through all nodes, remove the root nodes and push them into the resulting
    // call order array in order based on overallCallOrder
    let resultingCallOrder: string[] = [];

    while (keyToNode.size !== 0) {
      let nextGroup: string[] = [];
      for (let keyNodePair of keyToNode) {
        if (keyNodePair[1].size === 0) {
          nextGroup.push(keyNodePair[0]);
        }
      }

      nextGroup.sort((a, b) => {
        let aIndex = overallCallOrder.indexOf(a);
        let bIndex = overallCallOrder.indexOf(b);
        return aIndex - bIndex;
      });

      if (!isProperties && this.options.isAscending) {
        resultingCallOrder.push(...nextGroup);
      } else {
        resultingCallOrder.unshift(...nextGroup);
      }

      for (let key of nextGroup) {
        keyToNode.delete(key);

        for (let parents of keyToNode.values()) {
          parents.delete(key);
        }
      }
    }

    return resultingCallOrder;
  }

  private getCalleeOrder(nodes: any[]) {
    let memberExpressionOrder: string[] = [];
    for (let node of nodes) {
      if (node == null) {
        continue;
      }
      for (let property in node) {
        if (property === "type" || property === "loc" || property === "range") {
          continue;
        }
        let value = node[property];
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
        } else if (isArray(value)) {
          memberExpressionOrder.push(...this.getCalleeOrder(value));
        }
      }
    }

    return memberExpressionOrder;
  }
}
