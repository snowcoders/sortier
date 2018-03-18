import { Comment, SwitchCase } from "estree";

import { reorderValues, getContextGroups } from "../common/sort-utils";

export interface SortSwitchCaseOptions {
}

export function sortSwitchCase(cases: SwitchCase[], comments: Comment[], fileContents: string, options?: SortSwitchCaseOptions) {
    let newFileContents = fileContents.slice();

    if (cases.length <= 1) {
        return newFileContents;
    }

    // Never sort the default portion, it always comes last
    if (cases[cases.length - 1].test == null) {
        cases = cases.slice(0, cases.length - 1);
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
                        return value.type === "BreakStatement";
                    }).length !== 0;
                }
                return value.type === "BreakStatement";
            });
            if (breakStatement.length === 0) {
                continue;
            }

            switchGroupsWithBreaks.push(cases.slice(switchCaseStart, switchCaseEnd + 1));

            switchCaseStart = switchCaseEnd + 1;
        }

        switchGroupsWithBreaks.sort((a: any, b: any) => {
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
            let aValue = aTest.raw;
            let bValue = bTest.raw;
            if (aValue == null) {
                throw new Error("Null value for switch case statement");
            }
            if (bValue == null) {
                throw new Error("Null value for switch case statement");
            }

            return aValue.localeCompare(bValue);
        });

        let newOrder = [].concat.apply([], switchGroupsWithBreaks);

        newFileContents = reorderValues(newFileContents, comments, cases, newOrder);
    }

    return newFileContents;
}