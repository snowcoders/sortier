import { JSONSchemaType } from "ajv";
import { Comment } from "estree";
import { LoggerVerboseOption, LogUtils } from "../../utilities/log-utils.js";
import {
  BaseNode,
  compare,
  reorderValues,
} from "../../utilities/sort-utils.js";

const sortByExportOptionsGroups = ["*", "interfaces", "types"] as const;
export type SortByExportOptionsGroups =
  typeof sortByExportOptionsGroups[number];

export interface SortImportDeclarationSpecifiersOptions {
  /**
   * @default ["*", "interfaces", "types"]
   */
  groups: SortByExportOptionsGroups[];
}

export const sortImportDeclarationSpecifiersOptionsSchema: JSONSchemaType<SortImportDeclarationSpecifiersOptions> =
  {
    type: "object",
    properties: {
      groups: {
        type: "array",
        items: {
          type: "string",
          enum: sortByExportOptionsGroups,
        },
        uniqueItems: true,
        nullable: true,
        contains: {
          type: "string",
          const: "*",
        },
        default: [...sortByExportOptionsGroups],
      },
    },
    required: [],
  };

interface SingleSpecifier extends BaseNode {
  // Null is the same as "value"
  importKind: null | "value" | "type" | "typeof";
  importedName: string;
  isDefaultImportType: boolean;
  isInterface: boolean;
}

export function sortImportDeclarationSpecifiers(
  specifiers: any,
  comments: Comment[],
  fileContents: string,
  options: SortImportDeclarationSpecifiersOptions
): string {
  // If there is one or less specifiers, there is not anything to sort
  if (specifiers.length <= 1) {
    return fileContents;
  }

  const unsortedSpecifiers = specifiers.map((specifier: any) => {
    const importedName =
      specifier.imported != null
        ? specifier.imported.name
        : specifier.local.name;
    let start = specifier.start || specifier.range[0];
    const end = specifier.end || specifier.range[1];

    // Modify start based on the importKind if needed
    switch (specifier.importKind) {
      case "typeof":
      case "type": {
        // Flow doesn't provide us the range from "type <Specifier>", they only provide
        // the range of "<specifier>" so we're going to be a bit safe here and do some checks
        const possibleNewStart = fileContents.lastIndexOf(
          specifier.importKind,
          start
        );
        const textBetweenOldStartAndNewStart = fileContents.substring(
          possibleNewStart + specifier.importKind.length,
          start
        );
        const isNonWhitespaceBetweenOldStartAndNewStart =
          textBetweenOldStartAndNewStart.match(/\S/) != null;
        if (isNonWhitespaceBetweenOldStartAndNewStart) {
          return null;
        }
        start = possibleNewStart;
        break;
      }
      case "value":
      case undefined:
      case null:
        break;
      default:
        // If it's a type we haven't encountered, return null so we don't sort
        return null;
    }

    return {
      importKind: specifier.importKind,
      importedName: importedName,
      isDefaultImportType: specifier.type.indexOf("Default") !== -1,
      isInterface: nameIsLikelyInterface(importedName),
      range: [start, end],
    };
  });

  if (unsortedSpecifiers.includes(null)) {
    // If something weird happened when parsing the specifiers, exit without sorting
    LogUtils.log(
      LoggerVerboseOption.Diagnostic,
      "Encountered issue parsing import specifiers, skipping sorting this node"
    );
    return fileContents;
  }

  // First create an object to remember all that we care about
  const sortedSpecifiers = unsortedSpecifiers.slice();

  // Sort them by name
  let everythingRank = options.groups.indexOf("*");
  if (everythingRank === -1) {
    everythingRank = 0;
  }
  let interfaceRank = options.groups.indexOf("interfaces");
  if (interfaceRank === -1) {
    interfaceRank = everythingRank;
  }
  let typeRanking = options.groups.indexOf("types");
  if (typeRanking === -1) {
    typeRanking = everythingRank;
  }
  sortedSpecifiers.sort((a: SingleSpecifier, b: SingleSpecifier) => {
    let aRank = everythingRank;
    if (a.isInterface) {
      aRank = interfaceRank;
    }
    if (a.importKind === "type" || a.importKind === "typeof") {
      aRank = typeRanking;
    }
    if (a.isDefaultImportType) {
      aRank = aRank - options.groups.length;
    }

    let bRank = everythingRank;
    if (b.isInterface) {
      bRank = interfaceRank;
    }
    if (b.importKind === "type" || b.importKind === "typeof") {
      bRank = typeRanking;
    }
    if (b.isDefaultImportType) {
      bRank = bRank - options.groups.length;
    }

    if (aRank === bRank) {
      return compare(a.importedName, b.importedName);
    }
    return aRank - bRank;
  });

  return reorderValues(
    fileContents,
    comments,
    unsortedSpecifiers,
    sortedSpecifiers
  );
}

function nameIsLikelyInterface(name: string) {
  return (
    name.length >= 2 && name[0] === "I" && "A" <= name[1] && name[1] <= "Z"
  );
}
