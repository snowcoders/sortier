import {
  BaseExpression,
  BaseNodeWithoutComments,
  Comment,
  SwitchCase,
} from "estree";

import {
  BaseNode,
  compare,
  getContextGroups,
  reorderValues,
} from "../../utilities/sort-utils";

enum HasImmediateExitOption {
  Indeterminate,
  True,
  False,
}

export interface SortSwitchCaseOptions {}

export function sortSwitchCases(
  cases: SwitchCase[],
  comments: Comment[],
  fileContents: string,
  options?: SortSwitchCaseOptions
) {
  if (cases.length <= 1) {
    return fileContents;
  }

  // Never sort the default portion, it always comes last
  if (cases[cases.length - 1].test == null) {
    cases = cases.slice(0, cases.length - 1);
  }

  if (
    cases.findIndex((value) => {
      return value.test == null;
    }) !== -1
  ) {
    // If there is a default statement in the middle of the case statements, that is something we do not handle currently
    return fileContents;
  }

  let doesBreakOut = HasImmediateExitOption.Indeterminate;
  let newFileContents = fileContents.slice();
  let contextGroups = getContextGroups(cases, comments, fileContents);

  for (let x = 0; x < contextGroups.length; x++) {
    let cases = contextGroups[x].nodes;
    let comments = contextGroups[x].comments;
    if (cases.length <= 1) {
      // No need to sort if there's only one case
      continue;
    }

    doesBreakOut = doesCaseBreakOutOfSwitch(cases[cases.length - 1]);
    if (doesBreakOut !== HasImmediateExitOption.True) {
      cases.pop();
    }

    // Determine where the "break" statements are so we dont' sort through them
    // which would change the logic of the code
    let switchGroupsWithBreaks: Array<SwitchCase[]> = [];
    let switchCaseStart = 0;
    let switchCaseEnd = 0;
    for (switchCaseEnd = 0; switchCaseEnd < cases.length; switchCaseEnd++) {
      // Do not rearrange items that are in a non-break statement
      doesBreakOut = doesCaseBreakOutOfSwitch(cases[switchCaseEnd]);
      if (doesBreakOut === HasImmediateExitOption.Indeterminate) {
        return fileContents;
      }
      if (doesBreakOut === HasImmediateExitOption.False) {
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
            .filter((value) => value != null) as BaseExpression[];
          let sorted = unsorted.slice().sort((a: any, b: any) => {
            let aText = getSortableText(a, fileContents);
            let bText = getSortableText(b, fileContents);
            return compare(aText, bText);
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

    // If the last switch group is a fall through, don't include it in the swap
    doesBreakOut = doesCaseBreakOutOfSwitch(cases[cases.length - 1]);
    if (doesBreakOut !== HasImmediateExitOption.True) {
      switchGroupsWithBreaks.pop();
    }

    // Now sort the actual switch groups
    let switchGroupsWithBreaksSorted = switchGroupsWithBreaks.slice();
    let switchGroupToLowestCase = new Map();
    for (let switchGroupsWithBreak of switchGroupsWithBreaksSorted) {
      let lowestText: null | string = null;
      for (let caseStatement of switchGroupsWithBreak) {
        let test = caseStatement.test;
        if (test == null) {
          continue;
        }
        let testRange = test.range;
        if (testRange == null) {
          continue;
        }

        let text = fileContents.substring(testRange[0], testRange[1]);

        if (lowestText == null || compare(lowestText, text) > 0) {
          lowestText = text;
        }
      }
      if (lowestText != null) {
        switchGroupToLowestCase.set(switchGroupsWithBreak, lowestText);
      }
    }
    switchGroupsWithBreaksSorted.sort((a: any, b: any) => {
      let aValue = switchGroupToLowestCase.get(a);
      let bValue = switchGroupToLowestCase.get(b);
      if (aValue == null) {
        throw new Error("Null value for switch case statement");
      }
      if (bValue == null) {
        throw new Error("Null value for switch case statement");
      }

      return compare(aValue, bValue);
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

function doesCaseBreakOutOfSwitch(caseStatement: any): HasImmediateExitOption {
  return doesHaveImmediateExit(caseStatement.consequent);
}

function doesHaveImmediateExit(values: any): HasImmediateExitOption {
  let isIndeterminate = false;
  for (let value of values) {
    switch (value.type) {
      case "BlockStatement": {
        return doesHaveImmediateExit(value.body);
      }
      case "BreakStatement":
      case "ReturnStatement":
      case "ThrowStatement": {
        return HasImmediateExitOption.True;
      }
      // @ts-ignore - Fallthrough expected
      case "SwitchStatement": {
        // If the last option in the switch statement has an exit, then either
        // all previosu consequents have an exit (e.g. not getting to the last one)
        // or they all fall through to the last one which means we exit
        if (
          doesHaveImmediateExit(
            value.cases[value.cases.length - 1].consequent
          ) === HasImmediateExitOption.True
        ) {
          return HasImmediateExitOption.True;
        }
      }
      default:
        // There are several types which are a bit more complicated which
        // leaves us in an undeterminate state if we will exit or not
        if (
          // Value is some sort of loop
          value.body != null ||
          // Value is some sort of conditional
          value.consequent != null ||
          // Value is a try catch
          value.block != null
        ) {
          isIndeterminate = true;
        }
    }
  }
  return isIndeterminate
    ? HasImmediateExitOption.Indeterminate
    : HasImmediateExitOption.False;
}

function getSortableText(a: any, fileContents: string) {
  if (a == null) {
    return null;
  }

  if (a.raw != null) {
    return a.raw;
  }

  if (a.expression != null) {
    return a.expression.raw;
  }

  return fileContents.substring(a.range[0], a.range[1]);
}

function caseGroupsToMinimumTypeinformations(
  switchGroupsWithBreaks: SwitchCase[][]
) {
  return switchGroupsWithBreaks.map((value) => {
    let firstNode: BaseNodeWithoutComments = value[0];

    let firstRange = firstNode.range;
    let lastRange = value[value.length - 1].range;
    if (firstRange == null || lastRange == null) {
      throw new Error("Range is null");
    }
    let result: BaseNode = {
      range: [firstRange[0], lastRange[1]],
    };
    return result;
  });
}
