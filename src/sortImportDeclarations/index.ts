// Utils
import { nthIndexOf } from "../common/string-utils";

export interface SortImportDeclarationsOptions {
    orderBy: "first-specifier" | "source"
}

interface SingleImportSource {
    firstSpecifier: string,
    originalIndex: number,
    source: string,
    originalLocation: {
        end: {
            column: number
            index: number,
            line: number,
        }
        start: {
            column: number
            index: number,
            line: number,
        },
    }
};

export function sortImportDeclarations(body: any, fileContents: string, options?: SortImportDeclarationsOptions) {
    let ensuredOptions = ensureOptions(options);

    // First create an object to remember all that we care about
    let overallIndex = 0;
    let newFileContents = fileContents.slice();
    while (overallIndex < body.length) {
        let sortedImportSources: SingleImportSource[] = [];
        for (; overallIndex < body.length; overallIndex++) {
            let importSource = body[overallIndex];

            if (importSource.type !== "ImportDeclaration") {
                if (sortedImportSources.length !== 0) {
                    break;
                } else {
                    continue;
                }
            }

            if (sortedImportSources.length != 0 &&
                importSource.loc.start.line - sortedImportSources[sortedImportSources.length - 1].originalLocation.end.line != 1) {
                break;
            }
            sortedImportSources.push({
                firstSpecifier: importSource.specifiers[0] && importSource.specifiers[0].local.name || "",
                originalIndex: overallIndex,
                originalLocation: {
                    end: {
                        column: importSource.loc.end.column,
                        index: importSource.end,
                        line: importSource.loc.end.line
                    },
                    start: {
                        column: importSource.loc.start.column,
                        index: importSource.start,
                        line: importSource.loc.start.line
                    }
                },
                source: importSource.source.value
            });
        }

        // Sort them by name
        sortedImportSources.sort((a: SingleImportSource, b: SingleImportSource) => {
            if (ensuredOptions.orderBy === "first-specifier") {
                let result = a.firstSpecifier.localeCompare(b.firstSpecifier);
                if (result !== 0) {
                    return result;
                }
                return a.source.localeCompare(b.source);
            } else {
                let result = a.source.localeCompare(b.source);
                if (result !== 0) {
                    return result;
                }
                return a.firstSpecifier.localeCompare(b.firstSpecifier);
            }
        });


        // Now go through the original specifiers again and if any have moved, switch them
        let newFileContentIndexCorrection = 0;
        for (let x = 0; x < sortedImportSources.length; x++) {
            let oldSpecifier = body[overallIndex - sortedImportSources.length + x];

            let spliceRemoveIndexStart = nthIndexOf(fileContents, "\n", oldSpecifier.loc.start.line - 1);
            if (spliceRemoveIndexStart === -1) {
                spliceRemoveIndexStart = 0;
            } else {
                spliceRemoveIndexStart++;
            }
            let spliceRemoveIndexEnd = nthIndexOf(fileContents, "\n", oldSpecifier.loc.end.line);
            if (spliceRemoveIndexEnd === -1) {
                spliceRemoveIndexEnd = fileContents.length;
            }
            else if (fileContents[spliceRemoveIndexEnd - 1] === "\r") {
                spliceRemoveIndexEnd--;
            }

            let untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart + newFileContentIndexCorrection);
            let untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd + newFileContentIndexCorrection);

            let spliceAddIndexStart = nthIndexOf(fileContents, "\n", sortedImportSources[x].originalLocation.start.line - 1);
            if (spliceAddIndexStart === -1) {
                spliceAddIndexStart = 0;
            } else {
                spliceAddIndexStart++;
            }
            let spliceAddIndexEnd = nthIndexOf(fileContents, "\n", sortedImportSources[x].originalLocation.end.line);
            if (spliceAddIndexEnd === -1) {
                spliceAddIndexEnd = fileContents.length;
            }
            if (fileContents[spliceAddIndexEnd - 1] === "\r") {
                spliceAddIndexEnd--;
            }
            let stringToInsert = fileContents.substring(spliceAddIndexStart, spliceAddIndexEnd);

            newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
            newFileContentIndexCorrection = newFileContents.length - fileContents.length;
        }
    }

    return newFileContents;
}

function ensureOptions(options: SortImportDeclarationsOptions | null | undefined): SortImportDeclarationsOptions {
    return {
        orderBy: options && options.orderBy || "source"
    };
}