import * as fs from "fs";

// Parsers
import { parse as parseFlow } from "../parsers/flow";
import { parse as parseTypescript } from "../parsers/typescript";

// Types of sorts
import { sortExpression, SortExpressionOptions } from "../sortExpression";
import { sortImportDeclarations, SortImportDeclarationsOptions } from "../sortImportDeclarations";
import { sortImportDeclarationSpecifiers, SortImportDeclarationSpecifiersOptions } from "../sortImportDeclarationSpecifiers";
import { sortTSUnionTypeAnnotation } from "../sortTSUnionTypeAnnotation";
import { sortUnionTypeAnnotation, SortUnionTypeAnnotationOptions } from "../sortUnionTypeAnnotation";
import { sortVariableDeclarator, SortVariableDeclaratorOptions } from "../sortVariableDeclarator";

// Utils
import { endsWith } from "../common/string-utils";

export interface ReprinterOptions {
    sortImportDeclarationSpecifiers?: null | SortImportDeclarationSpecifiersOptions,
    sortImportDeclarations?: null | SortImportDeclarationsOptions,
    sortVariableDeclarator?: null | SortVariableDeclaratorOptions,
    sortUnionTypeAnnotation?: null | SortUnionTypeAnnotationOptions,
    sortExpression?: null | SortExpressionOptions,
    isHelpMode?: boolean,
    parser?: "flow" | "typescript"
}

export class Reprinter {
    public static rewrite(filename: string, options: ReprinterOptions) {
        let reprinter = new Reprinter(filename, options);

        let fileContents = reprinter.getRewrittenFileContents();

        reprinter.writeFileContents(fileContents);
    }

    private _filename: string;
    private _options: ReprinterOptions;
    private _helpModeHasPrintedFilename: boolean;

    constructor(filename: string, options: ReprinterOptions) {
        this._filename = filename;
        this._options = options;
        this._helpModeHasPrintedFilename = false;
    }

    public getRewrittenFileContents() {
        let parser = this.getParser();
        let fileContents = this.readFileContents();

        let ast = parser(fileContents);
        let comments = ast.comments;
        let bodyStack = [ast.body || ast.program.body];

        while (bodyStack.length !== 0) {
            let body = bodyStack.pop();
            if (body == null) {
                continue;
            }

            // TODO ObjectExpression
            // TODO ObjectPattern
            // TODO JSXOpeningElement
            // TODO ObjectTypeAnnotation
            // TODO SwitchStatement

            // Now go through and push any bodies in the current context to the stack
            for (let item of body) {
                try {
                    switch (item.type) {
                        case "ImportDeclaration": {
                            if (this._options.sortImportDeclarationSpecifiers !== null) {
                                fileContents = sortImportDeclarationSpecifiers(item.specifiers, fileContents, this._options.sortImportDeclarationSpecifiers);
                            }
                            break;
                        }

                        case "IfStatement": {
                            bodyStack.push(item.consequent.body);
                            break;
                        }
                        case "ForStatement":
                        case "WhileStatement":
                        case "ForOfStatement": {
                            bodyStack.push(item.body.body);
                            break;
                        }

                        case "SwitchStatement": {
                            // TODO
                            break;
                        }

                        case "TSPropertySignature": {
                            if (this._options.sortUnionTypeAnnotation !== null) {
                                fileContents = sortTSUnionTypeAnnotation(item.typeAnnotation, comments, fileContents, this._options.sortUnionTypeAnnotation);
                            }
                            break;
                        }
                        case "VariableDeclaration": {
                            if (this._options.sortVariableDeclarator !== null) {
                                fileContents = sortVariableDeclarator(body, comments, fileContents, this._options.sortVariableDeclarator);
                            }
                            break;
                        }
                        case "InterfaceDeclaration": {
                            bodyStack.push(item.body.properties);
                            break;
                        }
                        case "ObjectTypeProperty": {
                            if (this._options.sortUnionTypeAnnotation !== null) {
                                fileContents = sortUnionTypeAnnotation(item.value, comments, fileContents, this._options.sortUnionTypeAnnotation);
                            }
                            break;
                        }
                        case "ReturnStatement": {
                            if (item.argument != null && this._options.sortExpression !== null) {
                                fileContents = sortExpression(item.argument, comments, fileContents, this._options.sortExpression);
                            }
                            break;
                        }
                        case "TSInterfaceDeclaration": {
                            bodyStack.push(item.body.body);
                            break;
                        }
                        case "FunctionDeclaration":
                        case "ClassDeclaration": {
                            if (item.body != null) {
                                bodyStack.push(item.body.body);
                            } else if (item.declaration) {
                                bodyStack.push(item.declaration.body.body);
                            } else {
                                this.printHelpModeInfo(item, fileContents);
                            }
                            break;
                        }
                        case "TypeAlias": {
                            if (item.right.type === "UnionTypeAnnotation") {
                                if (this._options.sortUnionTypeAnnotation !== null) {
                                    fileContents = sortUnionTypeAnnotation(item.right, comments, fileContents, this._options.sortUnionTypeAnnotation);
                                }
                            } else if (item.right.type === "ObjectTypeAnnotation") {
                                bodyStack.push(item.right.properties);
                            } else {
                                this.printHelpModeInfo(item, fileContents);
                            }
                            break;
                        }
                        case "ExportNamedDeclaration": {
                            body.push(item.declaration);
                            break;
                        }
                        case "MethodDefinition": {
                            bodyStack.push(item.value.body.body);
                            break;
                        }
                        case "ClassProperty": {
                            if (item.typeAnnotation && item.typeAnnotation.type === "TypeAnnotation" && item.typeAnnotation.typeAnnotation.type === "UnionTypeAnnotation") {
                                if (this._options.sortUnionTypeAnnotation !== null) {
                                    fileContents = sortUnionTypeAnnotation(item.typeAnnotation.typeAnnotation, comments, fileContents, this._options.sortUnionTypeAnnotation);
                                }
                                else {
                                    this.printHelpModeInfo(item, fileContents);
                                }
                            } else if (item.value == null) {
                                // No value to sort...
                                break;
                            }
                            else if (item.value && item.value.body && item.value.body.body) {
                                bodyStack.push(item.value.body.body);
                            }
                            else if ("ArrayExpression") {
                                // TODO
                            }
                            else {
                                this.printHelpModeInfo(item, fileContents);
                            }
                            break;
                        }
                        case "BlockStatement": {
                            bodyStack.push(item.body);
                            break;
                        }
                        case "ExpressionStatement": {
                            // TODO possibly sortExpression?
                            break;
                        }
                        case "ThrowStatement":
                        case "ContinueStatement":
                        case "EmptyStatement":
                        case "BreakStatement": {
                            // Skip since there isn't anything for us to sort
                            break;
                        }
                        case "TryStatement": {
                            bodyStack.push(item.block.body);
                            bodyStack.push(item.handler.body.body);
                            break;
                        }
                        default:
                            this.printHelpModeInfo(item, fileContents);
                            break;
                    }
                }
                catch (e) {
                    this.printHelpModeInfo(item, fileContents);
                    throw e;
                }
            }

            // Sorts that depend on other things sorting first
            if (this._options.sortImportDeclarations !== null) {
                fileContents = sortImportDeclarations(body, fileContents, this._options.sortImportDeclarations);
            }
        }

        return fileContents;
    }

    private getParser() {
        // If the options overide the parser type
        if (this._options.parser === "typescript") {
            return parseTypescript;
        }
        if (this._options.parser === "flow") {
            return parseFlow;
        }

        // If the user didn't override the parser type, try to infer it
        if (endsWith(this._filename, ".ts") ||
            endsWith(this._filename, ".ts.txt") ||
            endsWith(this._filename, ".tsx")) {
            return parseTypescript;
        } else if (endsWith(this._filename, ".js") ||
            endsWith(this._filename, ".js.txt") ||
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

    private printHelpModeInfo(item, fileContents: string) {
        if (this._options.isHelpMode === true) {
            if (!this._helpModeHasPrintedFilename) {
                console.log("");
                console.log(this._filename);
            }

            console.log(" - " + item.type + " - " + JSON.stringify(item.loc.start) + " - " + JSON.stringify(item.loc.end));
            console.log(fileContents.substring(item.range[0], item.range[1]));
        }
    }
}