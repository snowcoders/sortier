import { sortExpression } from "../sortExpression";

export interface SortVariableDeclaratorOptions {
}

export function sortVariableDeclarator(body: any, fileContents: string, options?: SortVariableDeclaratorOptions) {
    for (let item of body) {
        if (item.type === "VariableDeclaration") {
            item.declarations.forEach(declarator => {
                if (declarator.type == "VariableDeclarator") {
                    fileContents = new VariableDeclaratorSorter(declarator, fileContents, options || {}).sort();
                }
                else {
                    throw new Error("Unexpected - Please open a bug in github with the contents of your file (or the specific area it failed)");
                }
            });
        }
    }
    return fileContents;
}

class VariableDeclaratorSorter {
    private bodyItem: any;
    private fileContents: string;
    //private options: SortVariableDeclaratorOptions;

    constructor(bodyItem: any, fileContents: string, options: SortVariableDeclaratorOptions) {
        this.bodyItem = bodyItem;
        this.fileContents = fileContents;
        //this.options = options;
    }

    public sort(): string {
        return sortExpression(this.bodyItem.init, this.fileContents /* TODO */);
    }
}