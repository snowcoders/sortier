import { SortUnionTypeAnnotationOptions } from "../sortUnionTypeAnnotation";

import { reorderValues } from "../common/sort-utils";

export function sortTSUnionTypeAnnotation(unionTypeAnnotation, fileContents: string, options?: SortUnionTypeAnnotationOptions) {
  let ensuredOptions = ensureOptions(options);

  if (unionTypeAnnotation.typeAnnotation.type === "TSUnionType") {
    fileContents = new UnionTypeAnnotationSorter(unionTypeAnnotation, fileContents, ensuredOptions).sort();
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
  private fileContents: string;
  private options: SortUnionTypeAnnotationOptions;

  constructor(unionTypeAnnotation, fileContents: string, options: SortUnionTypeAnnotationOptions) {
    this.unionTypeAnnotation = unionTypeAnnotation;
    this.fileContents = fileContents;
    this.options = options;
  }

  public sort() {
    let unsortedTypes = this.unionTypeAnnotation.typeAnnotation.types;
    let sortedTypes = this.getSortOrderOfTypes();

    return reorderValues(this.fileContents, unsortedTypes, sortedTypes);
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

      // Do the actual compare
      if (aRank == bRank) {
        let aString = this.getStringToCompare(a);
        let bString = this.getStringToCompare(b);
        return aString.localeCompare(bString);
      }
      return aRank - bRank;
    });

    return newTypes;
  }

  private getStringToCompare(a) {
    if (a.type === "TSTypeReference") {
      return a.typeName.name;
    } else {
      return this.fileContents.substring(a.range[0], a.range[1]);
    }
  }
}