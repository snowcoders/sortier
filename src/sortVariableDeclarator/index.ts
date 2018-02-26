import { sortExpression } from "../sortExpression";

export type SortVariableDeclaratorOptionsGroups = "*" | "undefined" | "null";

export interface SortVariableDeclaratorOptions {
    groups: SortVariableDeclaratorOptionsGroups[],
    orderBy: "alpha"
}

export function sortVariableDeclarator(body: any, fileContents: string, options?: SortVariableDeclaratorOptions) {
    let ensuredOptions = ensureOptions(options);

    for (let item of body) {
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
    return fileContents;
}

function ensureOptions(options?: SortVariableDeclaratorOptions | null): SortVariableDeclaratorOptions {
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

class VariableDeclaratorSorter {
    // The list of operators we can flip around without actually causing logical differences
    // https://caligari.dartmouth.edu/doc/ibmcxx/en_US/doc/language/ref/ruclxbin.htm
    static commutativeOperators = ["*", "&", "|", "^"];

    private bodyItem: any;
    private fileContents: string;
    private options: SortVariableDeclaratorOptions;

    constructor(bodyItem: any, fileContents: string, options: SortVariableDeclaratorOptions) {
        this.bodyItem = bodyItem;
        this.fileContents = fileContents;
        this.options = options;
    }

    public sort(): string {
        return sortExpression(this.bodyItem.init, this.fileContents /* TODO */);
    }
}