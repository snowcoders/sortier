import { compare, reorderValues } from "../../utilities/sort-utils";
import { addParenthesis } from "../utilities/parser-utils";
import {
  TypeAnnotationOption,
  getObjectTypeRanks,
} from "../utilities/sort-utils";

export interface SortUnionTypeAnnotationOptions {
  groups?: TypeAnnotationOption[];
}

export function sortUnionTypeAnnotation(
  unionTypeAnnotation,
  comments,
  fileContents: string,
  options: SortUnionTypeAnnotationOptions
) {
  if (
    unionTypeAnnotation.type === "TSIntersectionType" ||
    unionTypeAnnotation.type === "UnionTypeAnnotation" ||
    unionTypeAnnotation.type === "IntersectionTypeAnnotation" ||
    unionTypeAnnotation.type === "TSUnionType"
  ) {
    fileContents = new UnionTypeAnnotationSorter(
      unionTypeAnnotation,
      comments,
      fileContents,
      options
    ).sort();
  }

  return fileContents;
}

class UnionTypeAnnotationSorter {
  private comments;
  private fileContents: string;
  private options: SortUnionTypeAnnotationOptions;
  private unionTypeAnnotationTypes;

  constructor(
    unionTypeAnnotation,
    comments,
    fileContents: string,
    options: SortUnionTypeAnnotationOptions
  ) {
    this.unionTypeAnnotationTypes = addParenthesis(
      fileContents,
      unionTypeAnnotation.types
    );
    this.comments = comments;
    this.fileContents = fileContents;
    this.options = options;
  }

  public sort() {
    let sortedTypes = this.getSortOrderOfTypes();

    let newFileContents = reorderValues(
      this.fileContents,
      this.comments,
      this.unionTypeAnnotationTypes,
      sortedTypes
    );

    return newFileContents;
  }

  private getSortOrderOfTypes() {
    let getRank = (value) => {
      let ranks = getObjectTypeRanks(this.options.groups);
      if (value.type === "TSParenthesizedType") {
        return getRank(value.typeAnnotation);
      } else if (
        value.type === "NullLiteralTypeAnnotation" ||
        value.type === "TSNullKeyword"
      ) {
        return ranks.null;
      } else if (
        (value.type === "GenericTypeAnnotation" &&
          value.id.name === "undefined") ||
        value.type === "TSUndefinedKeyword"
      ) {
        return ranks.undefined;
      } else if (value.type === "ObjectTypeAnnotation") {
        return ranks.object;
      } else if (
        value.type === "FunctionTypeAnnotation" ||
        value.type === "ArrowFunctionExpression"
      ) {
        return ranks.function;
      }
      return ranks.everything;
    };

    let newTypes = this.unionTypeAnnotationTypes.slice(0);
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
          return compare(a.type, b.type);
        }
      }

      if (isALiteral != isBLiteral) {
        return (isALiteral ? 1 : 0) - (isBLiteral ? 1 : 0);
      }

      let aString = this.getStringToCompare(a);
      let bString = this.getStringToCompare(b);
      return compare(aString, bString);
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
      return this.fileContents.substring(a.range[0], a.range[1]);
    }
  }
}
