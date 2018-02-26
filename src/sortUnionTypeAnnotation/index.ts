export type SortUnionTypeAnnotationOptionsGroups = "*" | "undefined" | "null";

export interface SortUnionTypeAnnotationOptions {
  groups: SortUnionTypeAnnotationOptionsGroups[],
  orderBy: "alpha"
}

export function sortUnionTypeAnnotation(unionTypeAnnotation, fileContents: string, options?: SortUnionTypeAnnotationOptions) {
  let ensuredOptions = ensureOptions(options);

  if (unionTypeAnnotation.type === "UnionTypeAnnotation") {
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
    let sortedTypes = this.getSortOrderOfTypes();

    let newFileContents = this.fileContents.slice();
    let newFileContentIndexCorrection = 0;
    // Now go through the original specifiers again and if any have moved, switch them
    for (let x = 0; x < this.unionTypeAnnotation.types.length; x++) {
      let specifier = this.unionTypeAnnotation.types[x];
      let newSpecifier = sortedTypes[x];

      let spliceRemoveIndexStart = (specifier.start || specifier.range[0]) + newFileContentIndexCorrection;
      let spliceRemoveIndexEnd = (specifier.end || specifier.range[1]) + newFileContentIndexCorrection;

      let untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
      let untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

      let spliceAddIndexStart = newSpecifier.range[0];
      let spliceAddIndexEnd = newSpecifier.range[1];
      let stringToInsert = this.fileContents.substring(spliceAddIndexStart, spliceAddIndexEnd);

      newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
      newFileContentIndexCorrection += (spliceAddIndexEnd - spliceAddIndexStart) - (spliceRemoveIndexEnd - spliceRemoveIndexStart);
    }

    return newFileContents;
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
      if (annotationType.type === "NullLiteralTypeAnnotation") {
        aRank = nullRank;
      }
      else if (annotationType.type === "GenericTypeAnnotation" && annotationType.id.name === "undefined") {
        aRank = undefinedRank;
      }

      return aRank;
    };

    let newTypes = this.unionTypeAnnotation.types.slice(0);
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
    if (a.type === "GenericTypeAnnotation") {
      return a.id.name;
    } else {
      return a.type;
    }
  }
}