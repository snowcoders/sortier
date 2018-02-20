import * as fs from "fs";

// Parsers
import { parse as parseFlow } from "../parsers/flow";
import { parse as parseTypescript } from "../parsers/typescript";

// Types of sorts
import { sortByModule, SortByModuleOptions } from "../sortImportDeclarations";
import { sortByExport, SortByExportOptions } from "../sortImportDeclarationSpecifiers";

// Utils
import { endsWith } from "../common/string-utils";

export interface ReprinterOptions {
    sortImportDeclarationSpecifiers?: null | SortByExportOptions,
    sortImportDeclarations?: null | SortByModuleOptions
}

export class Reprinter {
    public static rewrite(filename: string, options: ReprinterOptions) {
        let reprinter = new Reprinter(filename, options);

        let fileContents = reprinter.getRewrittenFileContents();

        reprinter.writeFileContents(fileContents);
    }

    private _filename: string;
    private _options: ReprinterOptions

    constructor(filename: string, options: ReprinterOptions) {
        this._filename = filename;
        this._options = options;
    }

    public getRewrittenFileContents() {
        // get the ast tree
        let parser = this.getParser();
        let fileContents = this.readFileContents();

        if (this._options.sortImportDeclarationSpecifiers !== null) {
            fileContents = sortByExport(parser, fileContents, this._options.sortImportDeclarationSpecifiers);
        }
        if (this._options.sortImportDeclarations !== null) {
            fileContents = sortByModule(parser, fileContents, this._options.sortImportDeclarations);
        }

        return fileContents;
    }

    private getParser() {
        if (endsWith(this._filename, ".ts") ||
            endsWith(this._filename, ".ts.test") ||
            endsWith(this._filename, ".tsx")) {
            return parseTypescript;
        } else if (endsWith(this._filename, ".js") ||
            endsWith(this._filename, ".js.test") ||
            endsWith(this._filename, ".jsx")) {
            return parseFlow;
        } else {
            throw new Error("File not supported");
        }
    }

    private readFileContents() {
        try {
            return fs.readFileSync(this._filename, "utf8");
        } catch (error) {
            // Add newline to split errors from filename line.
            console.log("");
            console.error(
                `Unable to read file: ${this._filename}\n${error.message}`
            );
            throw new Error("Could not read file");
        }
    }

    private writeFileContents(fileContents: string) {
        try {
            fs.writeFileSync(this._filename, fileContents, "utf8");
        } catch (error) {
            // Add newline to split errors from filename line.
            console.log("");
            console.error(
                `Unable to write file: ${this._filename}\n${error.message}`
            );
            throw new Error("Could not write file");
        }
    }
}