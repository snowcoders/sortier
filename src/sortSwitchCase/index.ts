import { Comment, SwitchCase } from "estree";

import { reorderValues } from "../common/sort-utils";

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

    // Blank lines between cases are considered Context breakers... we don't sort through them.
    let contextGroups: any[] = [];
    let commentGroups: Comment[][] = [];
    let partialCases = [cases[0]];
    let partialComments: Comment[] = [];
    let lastLoc = cases[0].loc;
    let firstCaseComment = comments.find((value) => {
        if (value.loc == null || lastLoc == null) {
            throw new Error("Comment location is null?");
        }
        return ((value.loc.end.line + 1) === lastLoc.start.line);
    });
    for (let casesIndex = 1; casesIndex < cases.length; casesIndex++) {
        if (lastLoc == null) {
            throw new Error("Case location is null?");
        }
        let thisLoc = cases[casesIndex].loc;
        if (thisLoc == null) {
            throw new Error("Case location is null?");
        }
        if ((lastLoc.end.line + 1) === thisLoc.start.line) {
            partialCases.push(cases[casesIndex])
            lastLoc = thisLoc;
            continue;
        }
        let nextComment = comments.find((value) => {
            if (value.loc == null || lastLoc == null) {
                throw new Error("Comment location is null?");
            }
            return ((lastLoc.end.line + 1) === value.loc.start.line);
        });
        if (nextComment != null) {
            partialComments.push(nextComment);
            lastLoc = nextComment.loc;
            casesIndex--;
            continue;
        }

        // The first comment can either bet a contextual comment or a non-contextual comment... you just don't know.
        // We base it on if there are other comments in the context group... if so, then we guess that it's not contextual
        if (firstCaseComment != null && partialComments.length !== 0) {
            partialComments.unshift(firstCaseComment);
        }
        contextGroups.push(partialCases);
        commentGroups.push(partialComments);

        partialCases = [cases[casesIndex]];
        partialComments = [];
        lastLoc = cases[casesIndex].loc;
        firstCaseComment = comments.find((value) => {
            if (value.loc == null || lastLoc == null) {
                throw new Error("Comment location is null?");
            }
            return ((value.loc.end.line + 1) === lastLoc.start.line);
        });
    }

    // The first comment can either bet a contextual comment or a non-contextual comment... you just don't know.
    // We base it on if there are other comments in the context group... if so, then we guess that it's not contextual
    if (firstCaseComment != null && partialComments.length !== 0) {
        partialComments.unshift(firstCaseComment);
    }

    contextGroups.push(partialCases);
    commentGroups.push(partialComments);

    for (let x = 0; x < contextGroups.length; x++) {
        let contextGroup = contextGroups[x];
        let commentGroup = commentGroups[x];
        let cases = contextGroup;
        if (cases.length === 0) {
            continue;
        }

        let switchGroupsWithBreaks: Array<SwitchCase[]> = [];
        let switchCaseStart = 0;
        let switchCaseEnd = 0;
        for (switchCaseEnd = 0; switchCaseEnd < cases.length; switchCaseEnd++) {
            // Do not rearrange items that are in a non-break statement
            let breakStatement = cases[switchCaseEnd].consequent.filter((value: any) => {
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

        newFileContents = reorderValues(newFileContents, commentGroup, cases, newOrder);
    }

    return newFileContents;
}