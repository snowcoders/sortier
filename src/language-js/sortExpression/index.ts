import { reorderValues } from "../utilities/sort-utils";

export type SortExpressionOptionsGroups =
  | "*"
  | "function"
  | "null"
  | "object"
  | "undefined";

export type SortExpressionOptions = Partial<SortExpressionOptionsRequired>;

export interface SortExpressionOptionsRequired {
  groups: SortExpressionOptionsGroups[];
}

export function sortExpression(
  expression,
  comments,
  fileContents: string,
  options?: SortExpressionOptions
) {
  return new ExpressionSorter(
    expression,
    comments,
    fileContents,
    ensureOptions(options)
  ).sort();
}

function ensureOptions(
  options?: null | SortExpressionOptions
): SortExpressionOptionsRequired {
  if (options == null) {
    return {
      groups: ["undefined", "null", "*", "object", "function"]
    };
  }

  return {
    groups: options.groups || ["undefined", "null", "*", "object", "function"]
  };
}

interface OperandValue {
  groupIndex: number;
  range: [number, number];
  value: string;
}

interface OperatorInfo {
  accumulatedOperator: null | string;
  values: OperandValue[];
}

type RankMap = {
  everything: number;
  function: number;
  null: number;
  object: number;
  undefined: number;
};

class ExpressionSorter {
  // The list of operators we can flip around without actually causing logical differences
  // https://caligari.dartmouth.edu/doc/ibmcxx/en_US/doc/language/ref/ruclxbin.htm
  static commutativeOperators = ["*", "&", "|", "^"];

  private expression;
  private comments;
  private fileContents: string;
  private options: SortExpressionOptionsRequired;
  private groupRanks: RankMap;

  constructor(
    expression,
    comments,
    fileContents: string,
    options: SortExpressionOptionsRequired
  ) {
    this.expression = expression;
    this.comments = comments;
    this.fileContents = fileContents;
    this.options = options;
    this.groupRanks = this.getAllRanks();
  }

  public sort() {
    if (this.expression == null) {
      // Nothing to sort
      return this.fileContents;
    }

    let operandStack = [this.expression];
    while (operandStack.length !== 0) {
      let operand = operandStack.pop();

      if (operand.type === "BinaryExpression") {
        if (
          ExpressionSorter.commutativeOperators.indexOf(operand.operator) === -1
        ) {
          // TODO - Should be able to sort items with a mix of commutative and non-commutative operands
          return this.fileContents;
        }
        operandStack.push(operand.left);
        operandStack.push(operand.right);
      } else {
        continue;
      }
    }

    let rebuiltString = this.sortAndFlattenOperandTree(
      this.rebuildVariableDeclarator(this.expression)
    );

    let untouchedBeginning = this.fileContents.slice(
      0,
      rebuiltString.values[0].range[0]
    );
    let untouchedEnd = this.fileContents.slice(
      rebuiltString.values[0].range[1]
    );

    return untouchedBeginning + rebuiltString.values[0].value + untouchedEnd;
  }

  // Recursive depth first search to rebuild the string
  public rebuildVariableDeclarator(operand: any): OperatorInfo {
    if (operand.type !== "BinaryExpression") {
      let group = this.getGroupIndex(operand);
      return {
        accumulatedOperator: null,
        values: [
          {
            range: operand.range,
            groupIndex: group,
            value: this.fileContents.substring(
              operand.range[0],
              operand.range[1]
            )
          }
        ]
      };
    }

    let accumulatedOperator = operand.operator;
    let left = this.rebuildVariableDeclarator(operand.left);
    let right = this.rebuildVariableDeclarator(operand.right);
    if (
      left.accumulatedOperator != null &&
      left.accumulatedOperator != operand.operator
    ) {
      accumulatedOperator = "Mixed";
      left = this.sortAndFlattenOperandTree(left);
    }
    if (
      right.accumulatedOperator != null &&
      right.accumulatedOperator != operand.operator
    ) {
      accumulatedOperator = "Mixed";
      right = this.sortAndFlattenOperandTree(right);
    }

    let values = left.values.slice(0);
    values = values.concat(right.values);

    return {
      accumulatedOperator: accumulatedOperator,
      values: values
    };
  }

  public sortAndFlattenOperandTree(operand: OperatorInfo): OperatorInfo {
    if (operand.accumulatedOperator == null) {
      return operand;
    }

    // Determine range we are working on in the file
    let rangeMin = operand.values[0].range[0];
    let rangeMax = operand.values[0].range[1];
    operand.values.forEach(element => {
      if (rangeMin > element.range[0]) {
        rangeMin = element.range[0];
      }
      if (rangeMax < element.range[1]) {
        rangeMax = element.range[1];
      }
    });

    let sortedValues;
    // If we are in a mixed scenario, we can't order because we may change the resulting value
    if (operand.accumulatedOperator === "Mixed") {
      sortedValues = operand.values;
    } else {
      sortedValues = this.getSortedValues(operand.values);
    }

    let newFileContents = reorderValues(
      this.fileContents,
      this.comments,
      operand.values,
      sortedValues
    );
    newFileContents = newFileContents.slice(rangeMin, rangeMax);

    return {
      accumulatedOperator: operand.accumulatedOperator,
      values: [
        {
          range: [rangeMin, rangeMax],
          groupIndex: this.groupRanks.everything,
          value: newFileContents
        }
      ]
    };
  }

  public getSortedValues(values: OperandValue[]) {
    let sortedValues = values.slice(0);

    // TODO Can these operand values be functions or objects?
    sortedValues.sort((a: OperandValue, b: OperandValue) => {
      let aRank = a.groupIndex;
      let bRank = b.groupIndex;

      if (aRank == bRank) {
        return a.value.localeCompare(b.value);
      }
      return aRank - bRank;
    });

    return sortedValues;
  }

  private getAllRanks(): RankMap {
    // Sort them by name
    let everythingRank = this.options.groups.indexOf("*");
    if (everythingRank === -1) {
      everythingRank = this.options.groups.length;
    }
    let nullRank = this.options.groups.indexOf("null");
    if (nullRank === -1) {
      nullRank = everythingRank;
    }
    let undefinedRank = this.options.groups.indexOf("undefined");
    if (undefinedRank === -1) {
      undefinedRank = everythingRank;
    }
    let objectRank = this.options.groups.indexOf("object");
    if (objectRank === -1) {
      objectRank = everythingRank;
    }
    let functionRank = this.options.groups.indexOf("function");
    if (functionRank === -1) {
      functionRank = everythingRank;
    }

    return {
      everything: everythingRank,
      null: nullRank,
      undefined: undefinedRank,
      object: objectRank,
      function: functionRank
    };
  }

  private getGroupIndex(a: any): number {
    if (a.type.indexOf("Function") !== -1) {
      return this.groupRanks.function;
    }
    if (a.type.indexOf("Object") !== -1) {
      return this.groupRanks.object;
    }
    if (a.raw === "null") {
      return this.groupRanks.null;
    }
    if (a.name === "undefined") {
      return this.groupRanks.undefined;
    }
    return this.groupRanks.everything;
  }
}
