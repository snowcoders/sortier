import { reorderValues } from "../common/sort-utils";

export type SortExpressionOptionsGroups = "null" | "undefined" | "*" | "function" | "object";

export interface SortExpressionOptions {
  groups: SortExpressionOptionsGroups[],
}

export function sortExpression(expression, comments, fileContents: string, options?: SortExpressionOptions) {
  return new ExpressionSorter(expression, comments, fileContents, ensureOptions(options)).sort();
}

function ensureOptions(options?: SortExpressionOptions | null): SortExpressionOptions {
  if (options == null) {
    return {
      groups: ["undefined", "null", "*", "object", "function"],
    };
  }

  if (options.groups != null && options.groups.indexOf("*") === -1) {
    options.groups.push("*");
  }

  return {
    groups: options.groups || ["undefined", "null", "*", "object", "function"],
  };
}

interface OperandValue {
  value: string,
  range: [number, number]
}

interface OperatorInfo {
  accumulatedOperator: null | string,
  values: OperandValue[]
}

class ExpressionSorter {
  // The list of operators we can flip around without actually causing logical differences
  // https://caligari.dartmouth.edu/doc/ibmcxx/en_US/doc/language/ref/ruclxbin.htm
  static commutativeOperators = ["*", "&", "|", "^"];

  private expression;
  private comments;
  private fileContents: string;
  private options: SortExpressionOptions;

  constructor(expression, comments, fileContents: string, options: SortExpressionOptions) {
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

    let operandStack = [this.expression];
    while (operandStack.length !== 0) {
      let operand = operandStack.pop();

      if (operand.type === "Literal" || operand.type === "Identifier") {
        continue;
      } else if (operand.type === "BinaryExpression") {
        if (ExpressionSorter.commutativeOperators.indexOf(operand.operator) === -1) {
          // TODO - Should be able to sort items with a mix of commutative and non-commutative operands
          return this.fileContents;
        }
        operandStack.push(operand.left);
        operandStack.push(operand.right);
      } else {
        // TODO - Currently only support sorting BinaryExpressions (We need examples of these sorts)
        return this.fileContents;
      }
    }

    let rebuiltString = this.sortAndFlattenOperandTree(this.rebuildVariableDeclarator(this.expression));

    let untouchedBeginning = this.fileContents.slice(0, rebuiltString.values[0].range[0]);
    let untouchedEnd = this.fileContents.slice(rebuiltString.values[0].range[1]);

    return untouchedBeginning + rebuiltString.values[0].value + untouchedEnd;
  }

  // Recursive depth first search to rebuild the string
  public rebuildVariableDeclarator(operand: any): OperatorInfo {
    if (operand.type === "Literal") {
      return {
        accumulatedOperator: null,
        values: [{
          value: operand.raw,
          range: operand.range
        }]
      };
    }
    if (operand.type === "Identifier") {
      return {
        accumulatedOperator: null,
        values: [{
          value: operand.name,
          range: operand.range
        }]
      };
    }
    if (operand.type !== "BinaryExpression") {
      throw new Error("Should never recurse into literal types");
    }

    let accumulatedOperator = operand.operator;
    let left = this.rebuildVariableDeclarator(operand.left);
    let right = this.rebuildVariableDeclarator(operand.right);
    if (left.accumulatedOperator != null && left.accumulatedOperator != operand.operator) {
      accumulatedOperator = "Mixed"
      left = this.sortAndFlattenOperandTree(left);
    }
    if (right.accumulatedOperator != null && right.accumulatedOperator != operand.operator) {
      accumulatedOperator = "Mixed"
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

    let newFileContents = reorderValues(this.fileContents, this.comments, operand.values, sortedValues);
    newFileContents = newFileContents.slice(rangeMin, rangeMax);

    return {
      accumulatedOperator: operand.accumulatedOperator,
      values: [{
        value: newFileContents,
        range: [rangeMin, rangeMax]
      }]
    };
  }

  public getSortedValues(values: OperandValue[]) {
    let sortedValues = values.slice(0);

    // Sort them by name
    let everythingRank = this.options.groups.indexOf("*");
    if (everythingRank === -1) {
      everythingRank = 0;
    }
    let interfaceRank = this.options.groups.indexOf("null");
    if (interfaceRank === -1) {
      interfaceRank = everythingRank;
    }
    let typeRanking = this.options.groups.indexOf("undefined");
    if (typeRanking === -1) {
      typeRanking = everythingRank;
    }
    // TODO Can these operand values be functions or objects?
    sortedValues.sort((a: OperandValue, b: OperandValue) => {
      let aRank = everythingRank;
      if (a.value == "null") {
        aRank = interfaceRank;
      }
      if (a.value == "undefined") {
        aRank = typeRanking;
      }

      let bRank = everythingRank;
      if (b.value == "null") {
        bRank = interfaceRank;
      }
      if (b.value == "undefined") {
        bRank = typeRanking;
      }

      if (aRank == bRank) {
        return a.value.localeCompare(b.value);
      }
      return aRank - bRank;
    });

    return sortedValues;
  }
}