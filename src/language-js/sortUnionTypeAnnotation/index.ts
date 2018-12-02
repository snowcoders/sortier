import {
  getObjectTypeRank,
  reorderValues,
  TypeAnnotationOption
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
  private unionTypeAnnotation;

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
    let getRank = value => {
      return getObjectTypeRank(value, this.options.groups);
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
