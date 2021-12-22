import { Comment } from "estree";
import { LoggerVerboseOption, LogUtils } from "../../utilities/log-utils.js";
import {
  BaseNode,
  compare,
  reorderValues,
} from "../../utilities/sort-utils.js";

export type SortByExportOptionsGroups = "*" | "interfaces" | "types";

export type SortImportDeclarationSpecifiersOptions =
  Partial<SortImportDeclarationSpecifiersOptionsRequired>;

interface SortImportDeclarationSpecifiersOptionsRequired {
  groups: SortByExportOptionsGroups[];
}

interface SingleSpecifier extends BaseNode {
  importKind: null | string;
  importedName: string;
  isDefaultImportType: boolean;
  isInterface: boolean;
}

export function sortImportDeclarationSpecifiers(
  specifiers: any,
  comments: Comment[],
  fileContents: string,
  options?: SortImportDeclarationSpecifiersOptions
) {
  const cleanedOptions = ensureOptions(options);

  fileContents = sortSingleSpecifier(
    specifiers,
    comments,
    fileContents,
    cleanedOptions
  );

  return fileContents;
}

function sortSingleSpecifier(
  specifiers: any,
  comments: Comment[],
  fileContents: string,
  options: SortImportDeclarationSpecifiersOptionsRequired
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
    if (specifier.importKind === "type") {
      // Flow doesn't provide us the range from "type <Specifier>", they only provide
      // the range of "<specifier>" so we're going to be a bit safe here and do some checks
      const possibleNewStart = fileContents.lastIndexOf("type", start);
      const textBetweenOldStartAndNewStart = fileContents.substring(
        possibleNewStart + 4,
        start
      );
      const isNonWhitespaceBetweenOldStartAndNewStart =
        textBetweenOldStartAndNewStart.match(/\S/) != null;
      if (isNonWhitespaceBetweenOldStartAndNewStart) {
        return null;
      }
      start = possibleNewStart;
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

function ensureOptions(
  options?: null | SortImportDeclarationSpecifiersOptions
): SortImportDeclarationSpecifiersOptionsRequired {
  if (options == null) {
    return {
      groups: ["*", "interfaces", "types"],
    };
  }

  return {
    groups: options.groups || ["*", "interfaces", "types"],
  };
}
