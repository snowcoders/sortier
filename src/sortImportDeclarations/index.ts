import { nthIndexOf } from "../common/string-utils";

export interface SortByModuleOptions {
    orderBy?: "alpha"
}

interface SingleImportSource {
    originalIndex: number,
    source: string,
    originalLocation: {
        start: {
            index: number,
            line: number,
            column: number
        },
        end: {
            index: number,
            line: number,
            column: number
        }
    }
};

export function sortByModule(parser: (fileContents: string) => any, fileContents: string, options?: SortByModuleOptions) {
    options = ensureOptions(options);

    let ast = parser(fileContents);
    let body = ast.body || ast.program.body;

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
                originalIndex: overallIndex,
                source: importSource.source.value,
                originalLocation: {
                    start: {
                        index: importSource.start,
                        line: importSource.loc.start.line,
                        column: importSource.loc.start.column
                    },
                    end: {
                        index: importSource.end,
                        line: importSource.loc.end.line,
                        column: importSource.loc.end.column
                    }
                }
            });
        }

        // Sort them by name
        sortedImportSources.sort((a: SingleImportSource, b: SingleImportSource) => {
            return a.source.localeCompare(b.source);
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
            } else {
                spliceAddIndexEnd--;
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

function ensureOptions(options: SortByModuleOptions | null | undefined): SortByModuleOptions {
    if (options == null) {
        return {
            orderBy: "alpha"
        };
    }

    return {
        orderBy: options.orderBy || "alpha"
    };
}