// Utils
import { ModuleDeclaration, Program } from "estree";
import { Comment, compare, getContextGroups, reorderValues } from "../../utilities/sort-utils.js";

export type SortImportDeclarationsOrderOption = "first-specifier" | "source";
export type SortImportDeclarationsOptions = Partial<SortImportDeclarationsOptionsRequired>;
interface SortImportDeclarationsOptionsRequired {
  orderBy: SortImportDeclarationsOrderOption;
}

export function sortImportDeclarations(
  program: Program,
  comments: Array<Comment>,
  fileContents: string,
  options?: SortImportDeclarationsOptions,
) {
  const ensuredOptions = ensureOptions(options);

  // Get all the import/export nodes
  const importExportNodes = program.body.filter((node) => {
    return node.type.match(/Export.*Declaration/) || node.type.match(/Import.*Declaration/);
  }) as Array<ModuleDeclaration>;

  // Polyfills shouldn't be sorted - Assuming all imports without specifiers are polyfills
  const polyfillIndexesOrUndefined = importExportNodes.map((value) => {
    if (value.type === "ImportDeclaration" && value.specifiers.length === 0) {
      return value.range;
    }
    return undefined;
  });
  const polyfillIndexes = polyfillIndexesOrUndefined
    .flat()
    .filter((value): value is NonNullable<typeof value> => value != undefined);

  const contextGroups = getContextGroups(importExportNodes, comments, fileContents, polyfillIndexes);

  let newFileContents = fileContents.slice();

  for (const contextGroup of contextGroups) {
    const { comments: unsortedComments, nodes: unsortedNodes } = contextGroup;
    const sortedNodes = unsortedNodes.slice().sort((a: ModuleDeclaration, b: ModuleDeclaration) => {
      return sortModuleDeclarations(a, b, ensuredOptions);
    });
    newFileContents = reorderValues(newFileContents, unsortedComments, unsortedNodes, sortedNodes);
  }

  return newFileContents;
}

function sortModuleDeclarations(
  a: ModuleDeclaration,
  b: ModuleDeclaration,
  ensuredOptions: SortImportDeclarationsOptionsRequired,
) {
  // If they both aren't import or both aren't export then order based off import/export
  if (a.type.substring(0, 4) !== b.type.substring(0, 4)) {
    return a.type.indexOf("Export") !== -1 ? 1 : -1;
  }
  if (ensuredOptions.orderBy === "first-specifier") {
    return sortBySpecifier(a, b) || sortByPath(a, b);
  }
  return sortByPath(a, b) || sortBySpecifier(a, b);
}

function ensureOptions(
  options: undefined | null | SortImportDeclarationsOptions,
): SortImportDeclarationsOptionsRequired {
  return {
    orderBy: "source",
    ...options,
  };
}

function sortBySpecifier(a: ModuleDeclaration, b: ModuleDeclaration) {
  const firstSpecifier_A = getFirstSpecifier(a);
  const firstSpecifier_B = getFirstSpecifier(b);
  return compare(firstSpecifier_A, firstSpecifier_B);
}

function getFirstSpecifier(declaration: ModuleDeclaration) {
  switch (declaration.type) {
    case "ExportAllDeclaration":
      return "";
    case "ExportDefaultDeclaration":
      return "";
    case "ExportNamedDeclaration":
    case "ImportDeclaration": {
      const local = declaration.specifiers[0]?.local;
      switch (local?.type) {
        case "Identifier":
          return local.name || "";
        case "Literal":
          return local.value?.toString() || "";
        default:
          return "";
      }
    }
  }
}

function sortByPath(a: ModuleDeclaration, b: ModuleDeclaration) {
  const source_A = getSource(a);
  const source_B = getSource(b);

  if (source_A == null) {
    if (source_B == null) {
      return 0;
    } else {
      return 1;
    }
  }
  if (source_B == null) {
    return 1;
  }

  const aIsRelative = source_A.startsWith(".");
  const bIsRelative = source_B.startsWith(".");
  if (aIsRelative === bIsRelative) {
    const comparisonResult = compare(source_A, source_B);
    return comparisonResult;
  } else {
    return Number(aIsRelative) - Number(bIsRelative);
  }
}

function getSource(declaration: ModuleDeclaration) {
  switch (declaration.type) {
    case "ExportAllDeclaration":
      return declaration.source.value?.toString();
    case "ExportDefaultDeclaration":
      return "";
    case "ExportNamedDeclaration":
      return declaration.source?.value?.toString();
    case "ImportDeclaration":
      return declaration.source.value?.toString();
  }
}
