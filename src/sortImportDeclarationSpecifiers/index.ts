export type SortByExportOptionsGroups = "*" | "types" | "interfaces";

export interface SortImportDeclarationSpecifiersOptions {
    groups: SortByExportOptionsGroups[],
    orderBy: "name"
}

interface SingleSpecifier {
    originalIndex: number,
    importedName: string,
    importKind: string | null,
    isInterface: boolean,
    originalLocation: {
        start: number,
        end: number
    }
};

export function sortImportDeclarationSpecifiers(specifiers: any, fileContents: string, options?: SortImportDeclarationSpecifiersOptions) {
    options = ensureOptions(options);

    fileContents = sortSingleSpecifier(specifiers, fileContents, options);

    return fileContents;
}

function sortSingleSpecifier(specifiers: any, fileContents: string, options: SortImportDeclarationSpecifiersOptions): string {
    // If there is one or less specifiers, there is not anything to sort
    if (specifiers.length <= 1) {
        return fileContents;
    }

    // First create an object to remember all that we care about
    let sortedSpecifiers: SingleSpecifier[] = [];
    for (let x = 0; x < specifiers.length; x++) {
        let specifier = specifiers[x];

        let importedName = specifier.imported != null ? specifier.imported.name : specifier.local.name;
        sortedSpecifiers.push({
            originalIndex: x,
            importedName: importedName,
            importKind: specifier.importKind,
            isInterface: nameIsLikelyInterface(importedName),
            originalLocation: {
                start: specifier.start || specifier.range[0],
                end: specifier.end || specifier.range[1]
            }
        });
    }

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
        if (a.isInterface === b.isInterface &&
            a.importKind === b.importKind) {
            return a.importedName.localeCompare(b.importedName);
        }

        let aRank = everythingRank;
        if (a.isInterface) {
            aRank = interfaceRank;
        }
        if (a.importKind != null) {
            aRank = typeRanking;
        }

        let bRank = everythingRank;
        if (b.isInterface) {
            bRank = interfaceRank;
        }
        if (b.importKind != null) {
            bRank = typeRanking;
        }
        if (aRank == bRank) {
            return a.importedName.localeCompare(b.importedName);
        }
        return aRank - bRank;
    });


    let newFileContents = fileContents.slice();
    let newFileContentIndexCorrection = 0;
    // Now go through the original specifiers again and if any have moved, switch them
    for (let x = 0; x < specifiers.length; x++) {
        let specifier = specifiers[x];
        if (sortedSpecifiers[x].originalIndex === x) {
            continue;
        }

        let spliceRemoveIndexStart = (specifier.start || specifier.range[0]) + newFileContentIndexCorrection;
        let spliceRemoveIndexEnd = (specifier.end || specifier.range[1]) + newFileContentIndexCorrection;
        // Flow allows for "type " and  "typeof " to prefix any export"
        if (specifier.importKind != null) {
            let text = fileContents.substring(0, spliceRemoveIndexStart - newFileContentIndexCorrection);
            let importKindIndex = text.lastIndexOf(specifier.importKind);
            spliceRemoveIndexStart = importKindIndex + newFileContentIndexCorrection;
        }

        let untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
        let untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

        let spliceAddIndexStart = sortedSpecifiers[x].originalLocation.start;
        let spliceAddIndexEnd = sortedSpecifiers[x].originalLocation.end;
        // Flow allows for "type " and  "typeof " to prefix any export"
        if (sortedSpecifiers[x].importKind != null) {
            let importKindIndex = fileContents.substring(0, spliceAddIndexStart).lastIndexOf((sortedSpecifiers[x] as any).importKind);
            spliceAddIndexStart = importKindIndex;
        }
        let stringToInsert = fileContents.substring(spliceAddIndexStart, spliceAddIndexEnd);

        newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
        newFileContentIndexCorrection += (spliceAddIndexEnd - spliceAddIndexStart) - (spliceRemoveIndexEnd - spliceRemoveIndexStart);
    }

    return newFileContents;
}

function nameIsLikelyInterface(name: string) {
    return (
        name.length >= 2 &&
        name[0] === "I" &&
        "A" <= name[1] && name[1] <= "Z"
    );
}

function ensureOptions(options?: SortImportDeclarationSpecifiersOptions | null): SortImportDeclarationSpecifiersOptions {
    if (options == null) {
        return {
            groups: ["*", "types", "interfaces"],
            orderBy: "name"
        };
    }

    return {
        groups: options.groups || ["*", "types", "interfaces"],
        orderBy: options.orderBy || "name"
    };
}