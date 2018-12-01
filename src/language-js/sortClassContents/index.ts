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

  private generateCallOrder(): string[] {
    // Sort the initial list as in the case of ties, we want to go with alphabetical always
    let sortedClassItems = this.classItems.slice();
    sortedClassItems.sort((a, b) => {
      return a.key.name.localeCompare(b.key.name);
    });

    // Storage of the overall call order as read from top to bottom, left to right
    let overallCallOrder: string[] = [];
    // Map of method names to parent information
    let keyToNode = new Map<string, Set<string>>();

    // Figure out what parents which methods have and break any cycles
    for (let classItem of sortedClassItems) {
      let methodName = classItem.key.name;
      let calls = this.generateCallOrderOld([classItem]);
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
    for (var i = 0; i < overallCallOrder.length; i++) {
      for (var j = i + 1; j < overallCallOrder.length; j++) {
        if (overallCallOrder[i] == overallCallOrder[j]) {
          overallCallOrder.splice(j, 1);
        }
      }
    }

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

      resultingCallOrder.push(...nextGroup);

      for (let key of nextGroup) {
        keyToNode.delete(key);

        for (let parents of keyToNode.values()) {
          parents.delete(key);
        }
      }
    }

    return resultingCallOrder;
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

  private generateCallOrderOld(nodes: any[]) {
    let memberExpressionOrder: string[] = [];
    for (let node of nodes) {
      if (node == null) {
        continue;
      }
      for (let property in node) {
        let value = node[property];
        if (value == null) {
          continue;
        } else if (
          value != null &&
          value.callee != null &&
          value.callee.object != null &&
          value.callee.object.type === "ThisExpression" &&
          value.callee.type === "MemberExpression" &&
          value.callee.property.name != null
        ) {
          memberExpressionOrder.push(value.callee.property.name);
        } else if (value.type != null) {
          memberExpressionOrder.push(...this.generateCallOrderOld([value]));
        } else if (isArray(value)) {
          memberExpressionOrder.push(...this.generateCallOrderOld(value));
        }
      }
    }

    return memberExpressionOrder;
  }
}
