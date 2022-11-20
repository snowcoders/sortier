import { Comment, compare, reorderValues } from "../../utilities/sort-utils.js";
import { addParenthesis } from "../utilities/parser-utils.js";
import { TypeAnnotationOption, getObjectTypeRanks } from "../utilities/sort-utils.js";

export interface SortUnionTypeAnnotationOptions {
  groups?: TypeAnnotationOption[];
}

export function sortUnionTypeAnnotation(
  unionTypeAnnotation: any,
  comments: Array<Comment>,
  fileContents: string,
  options: SortUnionTypeAnnotationOptions
) {
  if (
    unionTypeAnnotation.type === "TSIntersectionType" ||
    unionTypeAnnotation.type === "UnionTypeAnnotation" ||
    unionTypeAnnotation.type === "IntersectionTypeAnnotation" ||
    unionTypeAnnotation.type === "TSUnionType"
  ) {
    fileContents = new UnionTypeAnnotationSorter(unionTypeAnnotation, comments, fileContents, options).sort();
  }

  return fileContents;
}

class UnionTypeAnnotationSorter {
  private comments: Array<Comment>;
  private fileContents: string;
  private options: SortUnionTypeAnnotationOptions;
  private unionTypeAnnotationTypes: Array<any>;

  constructor(
    unionTypeAnnotation: any,
    comments: Array<Comment>,
    fileContents: string,
    options: SortUnionTypeAnnotationOptions
  ) {
    this.unionTypeAnnotationTypes = addParenthesis(fileContents, unionTypeAnnotation.types);
    this.comments = comments;
    this.fileContents = fileContents;
    this.options = options;
  }

  public sort() {
    const sortedTypes = this.getSortOrderOfTypes();

    const newFileContents = reorderValues(this.fileContents, this.comments, this.unionTypeAnnotationTypes, sortedTypes);

    return newFileContents;
  }

  private getSortOrderOfTypes() {
    const getRank = (value: any): number => {
      const ranks = getObjectTypeRanks(this.options.groups);
      if (value.type === "TSParenthesizedType") {
        return getRank(value.typeAnnotation);
      } else if (value.type === "NullLiteralTypeAnnotation" || value.type === "TSNullKeyword") {
        return ranks.null;
      } else if (
        (value.type === "GenericTypeAnnotation" && value.id.name === "undefined") ||
        value.type === "TSUndefinedKeyword"
      ) {
        return ranks.undefined;
      } else if (value.type === "ObjectTypeAnnotation") {
        return ranks.object;
      } else if (value.type === "FunctionTypeAnnotation" || value.type === "ArrowFunctionExpression") {
        return ranks.function;
      }
      return ranks.everything;
    };

    const newTypes = this.unionTypeAnnotationTypes.slice(0);
    newTypes.sort((a: any, b: any) => {
      // Figure out ranks
      const aRank = getRank(a);
      const bRank = getRank(b);

      // Do the actual compare
      if (aRank !== bRank) {
        return aRank - bRank;
      }

      const isALiteral = a.type.indexOf("Literal") !== -1 || a.type.indexOf("TSLastTypeNode") !== -1;
      const isBLiteral = b.type.indexOf("Literal") !== -1 || b.type.indexOf("TSLastTypeNode") !== -1;

      if (isALiteral && isBLiteral) {
        if (a.type !== b.type) {
          return compare(a.type, b.type);
        }
      }

      if (isALiteral !== isBLiteral) {
        return (isALiteral ? 1 : 0) - (isBLiteral ? 1 : 0);
      }

      const aString = this.getStringToCompare(a);
      const bString = this.getStringToCompare(b);
      return compare(aString, bString);
    });

    return newTypes;
  }

  private getStringToCompare(a: any) {
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
