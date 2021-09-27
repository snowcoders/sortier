// Utils
import { compare } from "../../utilities/sort-utils.js";
import { StringUtils } from "../../utilities/string-utils.js";

export type SortImportDeclarationsOrderOption = "first-specifier" | "source";
export type SortImportDeclarationsOptions =
  Partial<SortImportDeclarationsOptionsRequired>;
interface SortImportDeclarationsOptionsRequired {
  orderBy: SortImportDeclarationsOrderOption;
}

interface SingleImportSource {
  type: "import" | "export";
  firstSpecifier: string;
  originalIndex: number;
  originalLocation: {
    end: {
      column: number;
      index: number;
      line: number;
    };
    start: {
      column: number;
      index: number;
      line: number;
    };
  };
  source: string;
}

export function sortImportDeclarations(
  body: any,
  fileContents: string,
  options?: SortImportDeclarationsOptions
) {
  const ensuredOptions = ensureOptions(options);

  // First create an object to remember all that we care about
  let overallIndex = 0;
  let newFileContents = fileContents.slice();
  while (overallIndex < body.length) {
    const sortedImportSources: SingleImportSource[] = [];
    for (; overallIndex < body.length; overallIndex++) {
      const importSource = body[overallIndex];

      // Is this an import/export declaration?
      if (
        !(
          (importSource.type.match(/Export.*Declaration/) ||
            importSource.type.match(/Import.*Declaration/)) &&
          importSource.source != null
        )
      ) {
        if (sortedImportSources.length !== 0) {
          break;
        } else {
          continue;
        }
      }

      // Is there a line break?
      if (
        sortedImportSources.length !== 0 &&
        importSource.loc.start.line -
          sortedImportSources[sortedImportSources.length - 1].originalLocation
            .end.line !==
          1
      ) {
        break;
      }
      sortedImportSources.push({
        type: importSource.type.indexOf("Import") !== -1 ? "import" : "export",
        firstSpecifier: importSource?.specifiers?.[0]?.local.name || "",
        originalIndex: overallIndex,
        originalLocation: {
          end: {
            column: importSource.loc.end.column,
            index: importSource.end,
            line: importSource.loc.end.line,
          },
          start: {
            column: importSource.loc.start.column,
            index: importSource.start,
            line: importSource.loc.start.line,
          },
        },
        source: importSource.source.value,
      });
    }

    const sortBySpecifier = (a: SingleImportSource, b: SingleImportSource) => {
      return compare(a.firstSpecifier, b.firstSpecifier);
    };
    const sortByPath = (a: SingleImportSource, b: SingleImportSource) => {
      const aIsRelative = a.source.startsWith(".");
      const bIsRelative = b.source.startsWith(".");
      if (aIsRelative === bIsRelative) {
        return compare(a.source, b.source);
      } else {
        return Number(aIsRelative) - Number(bIsRelative);
      }
    };
    sortedImportSources.sort((a: SingleImportSource, b: SingleImportSource) => {
      if (a.type !== b.type) {
        return a.type === "export" ? 1 : -1;
      }
      if (ensuredOptions.orderBy === "first-specifier") {
        const result = sortBySpecifier(a, b);
        if (result !== 0) {
          return result;
        }
        return sortByPath(a, b);
      } else {
        const result = sortByPath(a, b);
        if (result !== 0) {
          return result;
        }
        return sortBySpecifier(a, b);
      }
    });

    // Now go through the original specifiers again and if any have moved, switch them
    let newFileContentIndexCorrection = 0;
    for (let x = 0; x < sortedImportSources.length; x++) {
      const oldSpecifier = body[overallIndex - sortedImportSources.length + x];

      let spliceRemoveIndexStart = StringUtils.nthIndexOf(
        fileContents,
        "\n",
        oldSpecifier.loc.start.line - 1
      );
      if (spliceRemoveIndexStart === -1) {
        spliceRemoveIndexStart = 0;
      } else {
        spliceRemoveIndexStart++;
      }
      let spliceRemoveIndexEnd = StringUtils.nthIndexOf(
        fileContents,
        "\n",
        oldSpecifier.loc.end.line
      );
      if (spliceRemoveIndexEnd === -1) {
        spliceRemoveIndexEnd = fileContents.length;
      } else if (fileContents[spliceRemoveIndexEnd - 1] === "\r") {
        spliceRemoveIndexEnd--;
      }

      const untouchedBeginning = newFileContents.slice(
        0,
        spliceRemoveIndexStart + newFileContentIndexCorrection
      );
      const untouchedEnd = newFileContents.slice(
        spliceRemoveIndexEnd + newFileContentIndexCorrection
      );

      let spliceAddIndexStart = StringUtils.nthIndexOf(
        fileContents,
        "\n",
        sortedImportSources[x].originalLocation.start.line - 1
      );
      if (spliceAddIndexStart === -1) {
        spliceAddIndexStart = 0;
      } else {
        spliceAddIndexStart++;
      }
      let spliceAddIndexEnd = StringUtils.nthIndexOf(
        fileContents,
        "\n",
        sortedImportSources[x].originalLocation.end.line
      );
      if (spliceAddIndexEnd === -1) {
        spliceAddIndexEnd = fileContents.length;
      }
      if (fileContents[spliceAddIndexEnd - 1] === "\r") {
        spliceAddIndexEnd--;
      }
      const stringToInsert = fileContents.substring(
        spliceAddIndexStart,
        spliceAddIndexEnd
      );

      newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
      newFileContentIndexCorrection =
        newFileContents.length - fileContents.length;
    }
  }

  return newFileContents;
}

function ensureOptions(
  options: undefined | null | SortImportDeclarationsOptions
): SortImportDeclarationsOptionsRequired {
  return {
    orderBy: "source",
    ...options,
  };
}
