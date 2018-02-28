import { ModuleDeclaration, Statement } from "estree";

export type SortByExportOptionsGroups = "*" | "types" | "interfaces";

export interface SortImportDeclarationSpecifiersOptions {
    groups: SortByExportOptionsGroups[],
    orderBy: "name"
}

interface SingleSpecifier {
    originalIndex: number,
    importedName: string,
    isType: boolean,
    isInterface: boolean,
    originalLocation: {
        start: number,
        end: number
    }
};

export function sortImportDeclarationSpecifiers(body: Array<Statement | ModuleDeclaration>, fileContents: string, options?: SortImportDeclarationSpecifiersOptions) {
    options = ensureOptions(options);

    for (let item of body) {
        if (item.type === "ImportDeclaration") {
            fileContents = sortSingleSpecifier(item, fileContents, options);
        }
    }

    return fileContents;
}

function sortSingleSpecifier(bodyItem: any, fileContents: string, options: SortImportDeclarationSpecifiersOptions): string {
    // If there is one or less specifiers, there is not anything to sort
    if (bodyItem.specifiers.length <= 1) {
        return fileContents;
    }

    // First create an object to remember all that we care about
    let sortedSpecifiers: SingleSpecifier[] = [];
    for (let x = 0; x < bodyItem.specifiers.length; x++) {
        let specifier = bodyItem.specifiers[x];

        let importedName = specifier.imported != null ? specifier.imported.name : specifier.local.name;
        sortedSpecifiers.push({
            originalIndex: x,
            importedName: importedName,
            isType: fileContents.substr((specifier.start || specifier.range[0]) - 5, 5) === "type " || fileContents.substr((specifier.start || specifier.range[0]) - 7, 7) === "typeof ",
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
            a.isType === b.isType) {
            return a.importedName.localeCompare(b.importedName);
        }

        let aRank = everythingRank;
        if (a.isInterface) {
            aRank = interfaceRank;
        }
        if (a.isType) {
            aRank = typeRanking;
        }

        let bRank = everythingRank;
        if (b.isInterface) {
            bRank = interfaceRank;
        }
        if (b.isType) {
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
    for (let x = 0; x < bodyItem.specifiers.length; x++) {
        let specifier = bodyItem.specifiers[x];
        if (sortedSpecifiers[x].originalIndex === x) {
            continue;
        }

        let spliceRemoveIndexStart = (specifier.start || specifier.range[0]) + newFileContentIndexCorrection;
        let spliceRemoveIndexEnd = (specifier.end || specifier.range[1]) + newFileContentIndexCorrection;
        // Flow allows for "type " and  "typeof " to prefix any export"
        if (spliceRemoveIndexStart > 5 && newFileContents.substr(spliceRemoveIndexStart - 5, 5) === "type ") {
            spliceRemoveIndexStart = spliceRemoveIndexStart - 5;
        }
        if (spliceRemoveIndexStart > 7 && newFileContents.substr(spliceRemoveIndexStart - 7, 7) === "typeof ") {
            spliceRemoveIndexStart = spliceRemoveIndexStart - 7;
        }

        let untouchedBeginning = newFileContents.slice(0, spliceRemoveIndexStart);
        let untouchedEnd = newFileContents.slice(spliceRemoveIndexEnd);

        let spliceAddIndexStart = sortedSpecifiers[x].originalLocation.start;
        let spliceAddIndexEnd = sortedSpecifiers[x].originalLocation.end;
        // Flow allows for "type " and  "typeof " to prefix any export"
        if (spliceAddIndexStart > 5 && fileContents.substr(spliceAddIndexStart - 5, 5) === "type ") {
            spliceAddIndexStart = spliceAddIndexStart - 5;
        }
        if (spliceAddIndexStart > 7 && fileContents.substr(spliceAddIndexStart - 7, 7) === "typeof ") {
            spliceAddIndexStart = spliceAddIndexStart - 7;
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