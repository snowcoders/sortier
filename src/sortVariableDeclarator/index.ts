import { VariableDeclarator } from "estree";

import { sortExpression } from "../sortExpression";

export interface SortVariableDeclaratorOptions {
}

export function sortVariableDeclarator(declarator: VariableDeclarator, comments: any, fileContents: string, options?: SortVariableDeclaratorOptions) {
    if (declarator.type == "VariableDeclarator") {
        fileContents = new VariableDeclaratorSorter(declarator, comments, fileContents, options || {}).sort();
    }
    else {
        throw new Error("Unexpected - Please open a bug in github with the contents of your file (or the specific area it failed)");
    }
    return fileContents;
}

class VariableDeclaratorSorter {
    private bodyItem: any;
    private comments: any;
    private fileContents: string;
    //private options: SortVariableDeclaratorOptions;

    constructor(bodyItem: any, comments: any, fileContents: string, options: SortVariableDeclaratorOptions) {
        this.bodyItem = bodyItem;
        this.comments = comments;
        this.fileContents = fileContents;
        //this.options = options;
    }

    public sort(): string {
        return sortExpression(this.bodyItem.init, this.comments, this.fileContents /* TODO */);
    }
}