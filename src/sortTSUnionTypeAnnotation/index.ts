import { SortUnionTypeAnnotationOptions } from "../sortUnionTypeAnnotation";

import { reorderValues } from "../common/sort-utils";

export function sortTSUnionTypeAnnotation(unionTypeAnnotation, comments, fileContents: string, options?: SortUnionTypeAnnotationOptions) {
  let ensuredOptions = ensureOptions(options);

  if (unionTypeAnnotation.typeAnnotation.type === "TSUnionType") {
    fileContents = new UnionTypeAnnotationSorter(unionTypeAnnotation, comments, fileContents, ensuredOptions).sort();
  }

  return fileContents;
}

function ensureOptions(options?: SortUnionTypeAnnotationOptions | null): SortUnionTypeAnnotationOptions {
  if (options == null) {
    return {
      groups: ["undefined", "null", "*"],
      orderBy: "alpha"
    };
  }

  if (options.groups != null && options.groups.indexOf("*") === -1) {
    options.groups.push("*");
  }

  return {
    groups: options.groups || ["undefined", "null", "*"],
    orderBy: options.orderBy || "alpha"
  };
}

class UnionTypeAnnotationSorter {
  private unionTypeAnnotation;
  private comments;
  private fileContents: string;
  private options: SortUnionTypeAnnotationOptions;

  constructor(unionTypeAnnotation, comments, fileContents: string, options: SortUnionTypeAnnotationOptions) {
    this.unionTypeAnnotation = unionTypeAnnotation;
    this.comments = comments;
    this.fileContents = fileContents;
    this.options = options;
  }

  public sort() {
    let unsortedTypes = this.unionTypeAnnotation.typeAnnotation.types;
    let sortedTypes = this.getSortOrderOfTypes();

    return reorderValues(this.fileContents, this.comments, unsortedTypes, sortedTypes);
  }

  private getSortOrderOfTypes() {
    // Sort them by name
    let everythingRank = this.options.groups.indexOf("*");
    if (everythingRank === -1) {
      everythingRank = 0;
    }
    let nullRank = this.options.groups.indexOf("null");
    if (nullRank === -1) {
      nullRank = everythingRank;
    }
    let undefinedRank = this.options.groups.indexOf("undefined");
    if (undefinedRank === -1) {
      undefinedRank = everythingRank;
    }

    let getRank = (annotationType) => {
      let aRank = everythingRank;
      if (annotationType.type === "TSNullKeyword") {
        aRank = nullRank;
      }
      else if (annotationType.type === "TSUndefinedKeyword") {
        aRank = undefinedRank;
      }

      return aRank;
    };

    let newTypes = this.unionTypeAnnotation.typeAnnotation.types.slice(0);
    newTypes.sort((a, b) => {
      // Figure out ranks
      let aRank = getRank(a);
      let bRank = getRank(b);

      if (aRank != bRank) {
        return aRank - bRank;
      }

      if (a.type !== b.type) {
        if (a.type === "TSLastTypeNode") {
          return 1;
        }
        if (b.type === "TSLastTypeNode") {
          return -1;
        }
        return a.type.localeCompare(b.type);
      }

      if (a.type === "TSLastTypeNode" &&
        b.type === "TSLastTypeNode") {
        let typeofA = typeof a.literal.value;
        let typeofB = typeof b.literal.value;

        if (typeofA !== typeofB) {
          return typeofA.localeCompare(typeofB);
        }
      }

      let aString = this.getStringToCompare(a);
      let bString = this.getStringToCompare(b);
      return aString.localeCompare(bString);
    });

    return newTypes;
  }

  private getStringToCompare(a) {
    if (a.type === "TSTypeReference") {
      return a.typeName.name;
    } else if (a.type === "TSLastTypeNode") {
      return a.literal.raw;
    } else {
      return this.fileContents.substring(a.range[0], a.range[1]);
    }
  }
}