import { Comment, SwitchCase } from "estree";

import { getContextGroups, MinimumTypeInformation, reorderValues } from "../common/sort-utils";

export interface SortSwitchCaseOptions {
}

export function sortSwitchCases(cases: SwitchCase[], comments: Comment[], fileContents: string, options?: SortSwitchCaseOptions) {
    let newFileContents = fileContents.slice();

    if (cases.length <= 1) {
        return newFileContents;
    }

    // Never sort the default portion, it always comes last
    if (cases[cases.length - 1].test == null) {
        cases = cases.slice(0, cases.length - 1);
    }

    if (cases.findIndex((value) => {
        return value.test == null;
    }) !== -1) {
        // If there is a default statement in the middle of the case statements, that is something we do not handle currently
        return fileContents;
    }

    let contextGroups = getContextGroups(cases, comments, fileContents);

    for (let x = 0; x < contextGroups.length; x++) {
        let cases = contextGroups[x].nodes;
        let comments = contextGroups[x].comments;
        if (cases.length === 0) {
            continue;
        }

        let switchGroupsWithBreaks: Array<SwitchCase[]> = [];
        let switchCaseStart = 0;
        let switchCaseEnd = 0;
        for (switchCaseEnd = 0; switchCaseEnd < cases.length; switchCaseEnd++) {
            // Do not rearrange items that are in a non-break statement
            let breakStatement = cases[switchCaseEnd].consequent.filter((value: any) => {
                if (value.type === "BlockStatement") {
                    return value.body.filter((value: any) => {
                        return value.type === "BreakStatement" || value.type === "ReturnStatement";
                    }).length !== 0;
                }
                return value.type === "BreakStatement" || value.type === "ReturnStatement";
            });
            if (breakStatement.length === 0) {
                continue;
            }

            switchGroupsWithBreaks.push(cases.slice(switchCaseStart, switchCaseEnd + 1));

            switchCaseStart = switchCaseEnd + 1;
        }

        let switchGroupsWithBreaksSorted = switchGroupsWithBreaks.slice();
        switchGroupsWithBreaksSorted.sort((a: any, b: any) => {
            let aFirst = a[0];
            let bFirst = b[0];
            if (aFirst == null) {
                throw new Error("Null value for switch case statement");
            }
            if (bFirst == null) {
                throw new Error("Null value for switch case statement");
            }
            let aTest = aFirst.test;
            let bTest = bFirst.test;
            if (aTest == null) {
                throw new Error("Null value for switch case statement");
            }
            if (bTest == null) {
                throw new Error("Null value for switch case statement");
            }

            let aValue = fileContents.substring(aTest.range[0], aTest.range[1]);
            let bValue = fileContents.substring(bTest.range[0], bTest.range[1]);
            if (aValue == null) {
                throw new Error("Null value for switch case statement");
            }
            if (bValue == null) {
                throw new Error("Null value for switch case statement");
            }

            return aValue.localeCompare(bValue);
        });

        newFileContents = reorderValues(
            newFileContents,
            comments,
            caseGroupsToMinimumTypeinformations(switchGroupsWithBreaks),
            caseGroupsToMinimumTypeinformations(switchGroupsWithBreaksSorted));
    }

    return newFileContents;
}

function caseGroupsToMinimumTypeinformations(switchGroupsWithBreaks: SwitchCase[][]) {
    return switchGroupsWithBreaks.map((value) => {
        let firstRange = value[0].range;
        let lastRange = value[value.length - 1].range;
        if (firstRange == null || lastRange == null) {
            throw new Error("Range is null");
        }
        let result: MinimumTypeInformation = {
            range: [firstRange[0], lastRange[1]]
        };
        return result;
    })
}