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
    sortExpression?: null | SortExpressionOptions
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
        let parser = this.getParser();
        let fileContents = this.readFileContents();

        let ast = parser(fileContents);
        let bodyStack = [ast.body || ast.program.body];

        while (bodyStack.length !== 0) {
            let body = bodyStack.pop();
            if (body == null) {
                continue;
            }

            // Sorts that happen over the whole body
            if (this._options.sortImportDeclarationSpecifiers !== null) {
                fileContents = sortImportDeclarationSpecifiers(body, fileContents, this._options.sortImportDeclarationSpecifiers);
            }
            if (this._options.sortImportDeclarations !== null) {
                fileContents = sortImportDeclarations(body, fileContents, this._options.sortImportDeclarations);
            }
            // TODO ObjectExpression
            // TODO ObjectPattern
            // TODO JSXOpeningElement
            // TODO ObjectTypeAnnotation
            // TODO SwitchStatement

            // Now go through and push any bodies in the current context to the stack
            for (let item of body) {
                // Sorts that were handled above
                if (item.type === "ImportDeclaration") { }

                // Sorts that happen per item type
                else if (item.type === "TSPropertySignature") {
                    if (this._options.sortUnionTypeAnnotation !== null) {
                        fileContents = sortTSUnionTypeAnnotation(item.typeAnnotation, fileContents, this._options.sortUnionTypeAnnotation);
                    }
                }
                else if (item.type === "VariableDeclaration") {
                    if (this._options.sortVariableDeclarator !== null) {
                        fileContents = sortVariableDeclarator(body, fileContents, this._options.sortVariableDeclarator);
                    }
                }
                else if (item.type === "InterfaceDeclaration") {
                    bodyStack.push(item.body.properties);
                }
                else if (item.type === "ObjectTypeProperty") {
                    if (this._options.sortUnionTypeAnnotation !== null) {
                        fileContents = sortUnionTypeAnnotation(item.value, fileContents, this._options.sortUnionTypeAnnotation);
                    }
                }
                else if (item.type === "ReturnStatement") {
                    if (item.argument != null && this._options.sortExpression !== null) {
                        fileContents = sortExpression(item.argument, fileContents, this._options.sortExpression);
                    }
                }
                // Possible next body types we may have to deal with
                else if (item.type === "TSInterfaceDeclaration") {
                    bodyStack.push(item.body.body);
                }
                else if (item.type === "ExportNamedDeclaration") {
                    if (item.declaration.type === "TypeAlias") {
                        bodyStack.push(item.declaration.right.properties);
                    } else if (item.declaration.type === "InterfaceDeclaration") {
                        bodyStack.push(item.declaration.body.properties);
                    } else {
                        bodyStack.push(item.declaration.body.body);
                    }
                }
                else if (item.type === "MethodDefinition") {
                    bodyStack.push(item.value.body.body);
                }
                else if (item.type === "ClassProperty") {
                    if (item.typeAnnotation && item.typeAnnotation.type === "TypeAnnotation" && item.typeAnnotation.typeAnnotation.type === "UnionTypeAnnotation") {
                        if (this._options.sortUnionTypeAnnotation !== null) {
                            fileContents = sortUnionTypeAnnotation(item.typeAnnotation.typeAnnotation, fileContents, this._options.sortUnionTypeAnnotation);
                        }
                    }
                    else if (item.value && item.value.body && item.value.body.body) {
                        bodyStack.push(item.value.body.body);
                    }
                }
                else if (item.type === "BlockStatement") {
                    bodyStack.push(item.body);
                }
                else if (item.type === "ClassDeclaration") {
                    bodyStack.push(item.body.body);
                }
                else {
                    continue;
                }
            }
        }

        return fileContents;
    }

    private getParser() {
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
}