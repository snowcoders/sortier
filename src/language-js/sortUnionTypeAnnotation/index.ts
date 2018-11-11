import { reorderValues } from "../common/sort-utils";

// TODO add ObjectTypeAnnotation to the end of this
export type SortUnionTypeAnnotationOptionsGroups =
  | "*"
  | "function"
  | "null"
  | "object"
  | "undefined";

export interface SortUnionTypeAnnotationOptions {
  groups: SortUnionTypeAnnotationOptionsGroups[];
}

export function sortUnionTypeAnnotation(
  unionTypeAnnotation,
  comments,
  fileContents: string,
  options?: SortUnionTypeAnnotationOptions
) {
  let ensuredOptions = ensureOptions(options);

  if (
    unionTypeAnnotation.type === "UnionTypeAnnotation" ||
    unionTypeAnnotation.type === "IntersectionTypeAnnotation" ||
    unionTypeAnnotation.type === "TSUnionType"
  ) {
    fileContents = new UnionTypeAnnotationSorter(
      unionTypeAnnotation,
      comments,
      fileContents,
      ensuredOptions
    ).sort();
  }

  return fileContents;
}

function ensureOptions(
  options?: null | SortUnionTypeAnnotationOptions
): SortUnionTypeAnnotationOptions {
  if (options == null) {
    return {
      groups: ["undefined", "null", "*", "object", "function"]
    };
  }

  if (options.groups != null && options.groups.indexOf("*") === -1) {
    options.groups.push("*");
  }

  return {
    groups: options.groups || ["undefined", "null", "*", "object", "function"]
  };
}

class UnionTypeAnnotationSorter {
  private unionTypeAnnotation;
  private comments;
  private fileContents: string;
  private options: SortUnionTypeAnnotationOptions;

  constructor(
    unionTypeAnnotation,
    comments,
    fileContents: string,
    options: SortUnionTypeAnnotationOptions
  ) {
    this.unionTypeAnnotation = unionTypeAnnotation;
    this.comments = comments;
    this.fileContents = fileContents;
    this.options = options;
  }

  public sort() {
    let sortedTypes = this.getSortOrderOfTypes();

    let newFileContents = reorderValues(
      this.fileContents,
      this.comments,
      this.unionTypeAnnotation.types,
      sortedTypes
    );

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
    let functionRank = this.options.groups.indexOf("function");
    if (functionRank === -1) {
      functionRank = everythingRank;
    }
    let objectRank = this.options.groups.indexOf("object");
    if (objectRank === -1) {
      objectRank = everythingRank;
    }

    let getRank = annotationType => {
      let aRank = everythingRank;
      if (
        annotationType.type === "NullLiteralTypeAnnotation" ||
        annotationType.type === "TSNullKeyword"
      ) {
        aRank = nullRank;
      } else if (
        (annotationType.type === "GenericTypeAnnotation" &&
          annotationType.id.name === "undefined") ||
        annotationType.type === "TSUndefinedKeyword"
      ) {
        aRank = undefinedRank;
      } else if (annotationType.type === "ObjectTypeAnnotation") {
        aRank = objectRank;
      } else if (
        annotationType.type === "FunctionTypeAnnotation" ||
        annotationType.type === "ArrowFunctionExpression"
      ) {
        aRank = functionRank;
      }

      return aRank;
    };

    let newTypes = this.unionTypeAnnotation.types.slice(0);
    newTypes.sort((a, b) => {
      // Figure out ranks
      let aRank = getRank(a);
      let bRank = getRank(b);

      // Do the actual compare
      if (aRank != bRank) {
        return aRank - bRank;
      }

      let isALiteral =
        a.type.indexOf("Literal") !== -1 ||
        a.type.indexOf("TSLastTypeNode") !== -1;
      let isBLiteral =
        b.type.indexOf("Literal") !== -1 ||
        b.type.indexOf("TSLastTypeNode") !== -1;

      if (isALiteral && isBLiteral) {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
      }

      if (isALiteral != isBLiteral) {
        return (isALiteral ? 1 : 0) - (isBLiteral ? 1 : 0);
      }

      let aString = this.getStringToCompare(a);
      let bString = this.getStringToCompare(b);
      return aString.localeCompare(bString);
    });

    return newTypes;
  }

  private getStringToCompare(a) {
    if (a.raw != null) {
      return a.raw;
    } else if (a.type === "GenericTypeAnnotation") {
      if (a.id.name === "$ReadOnly") {
        return a.typeParameters.params[0].properties[0].key.name;
      }
      return a.id.name;
    } else if (a.literal != null && a.literal.raw != null) {
      return a.literal.raw;
    } else {
      return a.type;
    }
  }
}
