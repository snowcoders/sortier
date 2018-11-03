import { BaseExpression, Comment, SwitchCase } from "estree";

import {
  getContextGroups,
  MinimumTypeInformation,
  reorderValues
} from "../common/sort-utils";
import { Logger, LoggerVerboseOption } from "../logger";

export interface SortSwitchCaseOptions {}

export function sortSwitchCases(
  cases: SwitchCase[],
  comments: Comment[],
  fileContents: string,
  options?: SortSwitchCaseOptions
) {
  let newFileContents = fileContents.slice();

  if (cases.length <= 1) {
    return newFileContents;
  }

  // Never sort the default portion, it always comes last
  if (cases[cases.length - 1].test == null) {
    cases = cases.slice(0, cases.length - 1);
  }

  if (
    cases.findIndex(value => {
      return value.test == null;
    }) !== -1
  ) {
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

    // Determine where the "break" statements are so we dont' sort through them
    // which would change the logic of the code
    let switchGroupsWithBreaks: Array<SwitchCase[]> = [];
    let switchCaseStart = 0;
    let switchCaseEnd = 0;
    for (switchCaseEnd = 0; switchCaseEnd < cases.length; switchCaseEnd++) {
      // Do not rearrange items that are in a non-break statement
      let breakStatement = cases[switchCaseEnd].consequent.filter(
        (value: any) => {
          if (value.type === "BlockStatement") {
            return (
              value.body.filter((value: any) => {
                return (
                  value.type === "BreakStatement" ||
                  value.type === "ReturnStatement"
                );
              }).length !== 0
            );
          }
          return (
            value.type === "BreakStatement" || value.type === "ReturnStatement"
          );
        }
      );
      if (breakStatement.length === 0) {
        continue;
      }

      switchGroupsWithBreaks.push(
        cases.slice(switchCaseStart, switchCaseEnd + 1)
      );

      switchCaseStart = switchCaseEnd + 1;
    }
    if (switchCaseStart < switchCaseEnd) {
      switchGroupsWithBreaks.push(
        cases.slice(switchCaseStart, switchCaseEnd + 1)
      );
    }

    // Within each case group with a break, if there are any case statements that share the same
    // execution block, they need to be sorted
    for (let x = 0; x < switchGroupsWithBreaks.length; x++) {
      let cases = switchGroupsWithBreaks[x];
      switchCaseStart = 0;
      switchCaseEnd = 0;
      for (let casesIndex = 0; casesIndex < cases.length; casesIndex++) {
        let caseStatement = cases[casesIndex];
        if (
          caseStatement.consequent == null ||
          caseStatement.consequent.length === 0
        ) {
          switchCaseEnd++;
        } else if (switchCaseStart < switchCaseEnd) {
          switchCaseEnd++;
          let unsorted = cases
            .slice(switchCaseStart, switchCaseEnd)
            .map((value: SwitchCase) => {
              return value.test;
            })
            .filter(value => value != null) as BaseExpression[];
          let sorted = unsorted.slice().sort((a: any, b: any) => {
            let aText = getSortableText(a);
            let bText = getSortableText(b);
            return aText.localeCompare(bText);
          });

          newFileContents = reorderValues(
            newFileContents,
            comments,
            unsorted,
            sorted
          );
          switchCaseStart = switchCaseEnd;
        }
      }
    }

    // Now sort the actual switch groups
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
      caseGroupsToMinimumTypeinformations(switchGroupsWithBreaksSorted)
    );
  }

  return newFileContents;
}

function getSortableText(a: any) {
  if (a == null) {
    return null;
  }

  if (a.raw != null) {
    return a.raw;
  }

  if (a.expression != null) {
    return a.expression.raw;
  }

  Logger.log(
    LoggerVerboseOption.Diagnostic,
    `Unknown case statement type: ${a.type}`
  );
  return null;
}

function caseGroupsToMinimumTypeinformations(
  switchGroupsWithBreaks: SwitchCase[][]
) {
  return switchGroupsWithBreaks.map(value => {
    let firstRange = value[0].range;
    let lastRange = value[value.length - 1].range;
    if (firstRange == null || lastRange == null) {
      throw new Error("Range is null");
    }
    let result: MinimumTypeInformation = {
      range: [firstRange[0], lastRange[1]]
    };
    return result;
  });
}
