import { Comment } from "estree";
import { BaseNode, reorderValues } from "../../utilities/sort-utils";

export type SortByExportOptionsGroups = "*" | "interfaces" | "types";

export interface SortImportDeclarationSpecifiersOptions {
  groups: SortByExportOptionsGroups[];
}

interface SingleSpecifier extends BaseNode {
  importedName: string;
  importKind: null | string;
  isDefaultImportType: boolean;
  isInterface: boolean;
}

export function sortImportDeclarationSpecifiers(
  specifiers: any,
  comments: Comment[],
  fileContents: string,
  options?: SortImportDeclarationSpecifiersOptions
) {
  options = ensureOptions(options);

  fileContents = sortSingleSpecifier(
    specifiers,
    comments,
    fileContents,
    options
  );

  return fileContents;
}

function sortSingleSpecifier(
  specifiers: any,
  comments: Comment[],
  fileContents: string,
  options: SortImportDeclarationSpecifiersOptions
): string {
  // If there is one or less specifiers, there is not anything to sort
  if (specifiers.length <= 1) {
    return fileContents;
  }

  let unsortedSpecifiers = specifiers.map(specifier => {
    {
      let importedName =
        specifier.imported != null
          ? specifier.imported.name
          : specifier.local.name;
      let start = specifier.start || specifier.range[0];
      let end = specifier.end || specifier.range[1];
      if (specifier.importKind != null) {
        start = fileContents.lastIndexOf(specifier.importKind, start);
      }
      return {
        importedName: importedName,
        importKind: specifier.importKind,
        isDefaultImportType: specifier.type.indexOf("Default") !== -1,
        isInterface: nameIsLikelyInterface(importedName),
        range: [start, end]
      };
    }
  });

  // First create an object to remember all that we care about
  let sortedSpecifiers = unsortedSpecifiers.slice();

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
    if (a.importKind != null) {
      aRank = typeRanking;
    }
    if (a.isDefaultImportType) {
      aRank = aRank - options.groups.length;
    }

    let bRank = everythingRank;
    if (b.isInterface) {
      bRank = interfaceRank;
    }
    if (b.importKind != null) {
      bRank = typeRanking;
    }
    if (b.isDefaultImportType) {
      bRank = bRank - options.groups.length;
    }

    if (aRank == bRank) {
      return a.importedName.localeCompare(b.importedName);
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

function ensureOptions(
  options?: null | SortImportDeclarationSpecifiersOptions
): SortImportDeclarationSpecifiersOptions {
  if (options == null) {
    return {
      groups: ["*", "interfaces", "types"]
    };
  }

  return {
    groups: options.groups || ["*", "interfaces", "types"]
  };
}
