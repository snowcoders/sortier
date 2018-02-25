export type SortByNameOptionsGroups = "*" | "undefined" | "null";

export interface SortByNameOptions {
    groups: SortByNameOptionsGroups[],
    orderBy: "alpha"
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

export function sortByName(parser: (fileContents: string) => any, fileContents: string, options?: SortByNameOptions) {
    let ensuredOptions = ensureOptions(options);

    let ast = parser(fileContents);
    let bodies = [ast.body || ast.program.body];

    while (bodies.length !== 0) {
        let body = bodies.pop();
        for (let item of body) {
            if (item.body != null) {
                bodies.push(item.body);
                continue;
            }
            if (item.declaration != null && item.declaration.body != null && item.declaration.body.body != null) {
                bodies.push(item.declaration.body.body);
                continue;
            }
            if (item.value != null && item.value.body != null && item.value.body.body != null) {
                bodies.push(item.value.body.body);
                continue;
            }
            if (item.type === "VariableDeclaration") {
                item.declarations.forEach(declarator => {
                    if (declarator.type == "VariableDeclarator") {
                        fileContents = new VariableDeclaratorSorter(declarator, fileContents, ensuredOptions).sort();
                    }
                    else {
                        throw new Error("Unexpected - Please open a bug in github with the contents of your file (or the specific area it failed)");
                    }
                });
            }
        }
    }

    return fileContents;
}

function ensureOptions(options?: SortByNameOptions | null): SortByNameOptions {
    if (options == null) {
        return {
            groups: ["undefined", "null", "*"],
            orderBy: "alpha"
        };
    }

    if (options.groups != null && options.groups.indexOf("*") === -1) {
        options.groups.push("*");
    }

    return {
        groups: options.groups || ["undefined", "null", "*"],
        orderBy: options.orderBy || "alpha"
    };
}

interface OperandValue {
    value: string,
    range: number[]
}

interface OperatorInfo {
    accumulatedOperator: null | string,
    values: OperandValue[]
}

class VariableDeclaratorSorter {
    bodyItem: any;
    fileContents: string;
    options: SortByNameOptions;

    constructor(bodyItem: any, fileContents: string, options: SortByNameOptions) {
        this.bodyItem = bodyItem;
        this.fileContents = fileContents;
        this.options = options;
    }

    public sort(): string {
        // The list of operators we can flip around without actually causing logical differences
        // https://caligari.dartmouth.edu/doc/ibmcxx/en_US/doc/language/ref/ruclxbin.htm
        let commutativeOperators = ["*", "&", "|", "^"];

        // If the type is literal, there are no operands to order around
        if (this.bodyItem.init.type == "Literal") {
            return this.fileContents;
        }

        let operandStack = [this.bodyItem.init];
        while (operandStack.length !== 0) {
            let operand = operandStack.pop();

            if (operand.type === "Literal" || operand.type === "Identifier") {
                continue;
            } else if (operand.type === "BinaryExpression") {
                if (commutativeOperators.indexOf(operand.operator) === -1) {
                    // TODO - Open Github issue - Should be able to sort items with a mix of commutative and non-commutative operands
                    return this.fileContents;
                }
                operandStack.push(operand.left);
                operandStack.push(operand.right);
            } else {
                // TODO - Open Github issue - Currently only support sorting BinaryExpressions (We need examples of these sorts)
                return this.fileContents;
            }
        }

        let rebuiltString = this.sortAndFlattenOperandTree(this.rebuildVariableDeclarator(this.bodyItem.init));

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

        let newFileContents = this.fileContents.slice(0);
        let newFileContentIndexCorrection = 0;
        // Now go through the original specifiers again and if any have moved, switch them
        for (let x = 0; x < sortedValues.length; x++) {
            let newValue = sortedValues[x];
            let oldValue = operand.values[x];

            let untouchedBeginning = newFileContents.slice(0, oldValue.range[0] + newFileContentIndexCorrection);
            let untouchedEnd = newFileContents.slice(oldValue.range[1] + newFileContentIndexCorrection);
            let stringToInsert = newValue.value;

            newFileContents = untouchedBeginning + stringToInsert + untouchedEnd;
            newFileContentIndexCorrection += (newValue.range[1] - newValue.range[0]) - (oldValue.range[1] - oldValue.range[0]);
        }
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