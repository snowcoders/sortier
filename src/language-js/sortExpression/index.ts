import { compare, reorderValues } from "../../utilities/sort-utils";
import { addParenthesis } from "../utilities/parser-utils";
import {
  TypeAnnotationOption,
  getObjectTypeRanks
} from "../utilities/sort-utils";

export type SortExpressionOptions = Partial<SortExpressionOptionsRequired>;

export interface SortExpressionOptionsRequired {
  groups?: TypeAnnotationOption[];
}

export function sortExpression(
  expression,
  comments,
  fileContents: string,
  options: SortExpressionOptions
) {
  return new ExpressionSorter(
    expression,
    comments,
    fileContents,
    options
  ).sort();
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

class ExpressionSorter {
  // The list of operators we can flip around without actually causing logical differences
  // https://caligari.dartmouth.edu/doc/ibmcxx/en_US/doc/language/ref/ruclxbin.htm
  static commutativeOperators = ["*", "&", "|", "^"];

  private comments;
  private expression;
  private fileContents: string;
  private options: SortExpressionOptionsRequired;

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
  }

  public sort() {
    if (this.expression == null) {
      // Nothing to sort
      return this.fileContents;
    }

    // Check to see if we can actually sort this binary expression
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
            groupIndex: group,
            range: operand.range,
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

    let unsortedValues = addParenthesis(this.fileContents, operand.values);
    let sortedValues;
    // If we are in a mixed scenario, we can't order because we may change the resulting value
    if (operand.accumulatedOperator === "Mixed") {
      sortedValues = unsortedValues;
    } else {
      sortedValues = this.getSortedValues(unsortedValues);
    }

    let newFileContents = reorderValues(
      this.fileContents,
      this.comments,
      unsortedValues,
      sortedValues
    );
    newFileContents = newFileContents.slice(rangeMin, rangeMax);

    return {
      accumulatedOperator: operand.accumulatedOperator,
      values: [
        {
          groupIndex: this.getAllRanks().everything,
          range: [rangeMin, rangeMax],
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
        return compare(a.value, b.value);
      }
      return aRank - bRank;
    });

    return sortedValues;
  }

  private getGroupIndex(a: any): number {
    let groupRanks = this.getAllRanks();
    if (a.type.indexOf("Function") !== -1) {
      return groupRanks.function;
    }
    if (a.type.indexOf("Object") !== -1) {
      return groupRanks.object;
    }
    if (a.raw === "null") {
      return groupRanks.null;
    }
    if (a.name === "undefined") {
      return groupRanks.undefined;
    }
    return groupRanks.everything;
  }

  private getAllRanks() {
    return getObjectTypeRanks(this.options.groups);
  }
}
