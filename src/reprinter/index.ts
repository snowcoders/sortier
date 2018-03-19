import * as fs from "fs";

import { Comment } from "estree";

// Parsers
import { parse as parseFlow } from "../parsers/flow";
import { parse as parseTypescript } from "../parsers/typescript";

// Types of sorts
import { sortExpression } from "../sortExpression";
import { sortImportDeclarations } from "../sortImportDeclarations";
import { sortImportDeclarationSpecifiers } from "../sortImportDeclarationSpecifiers";
import { sortJsxElement } from "../sortJsxElement";
import { sortObjectTypeAnnotation } from "../sortObjectTypeAnnotation";
import { sortSwitchCases } from "../sortSwitchCases";
import { sortUnionTypeAnnotation } from "../sortUnionTypeAnnotation";

// Utils
import { endsWith } from "../common/string-utils";
import { isArray } from "util";

export interface ReprinterOptions {
    sortImportDeclarations?: "source" | "first-specifier",
    sortTypeAnnotations?: ("null" | "undefined" | "*" | "function" | "object")[]
    isHelpMode?: boolean,
    isTestRun?: boolean,
    parser?: "flow" | "typescript"
}

export class Reprinter {
    public static rewrite(filename: string, options: ReprinterOptions) {
        let reprinter = new Reprinter(filename, options);

        let fileContents = reprinter.getRewrittenFileContents();

        if (options.isTestRun == null || !options.isTestRun) {
            reprinter.writeFileContents(fileContents);
        }
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
        let comments: Comment[] = ast.comments;

        return this.rewriteNodes([ast], comments, fileContents);
    }

    private rewriteNodes(originalNodes: any[], comments: Comment[], fileContents: string) {
        let nodes = originalNodes.slice();
        while (nodes.length !== 0) {
            let node = nodes.shift();
            if (isArray(node)) {
                throw new Error("Unexpected Exception - Array sent as node in rewrite nodes");
            }
            if (node == null) {
                throw new Error("Unexpected Exception - Node received is null");
            }

            // TODO ObjectExpression
            // TODO ObjectPattern
            // TODO JSXOpeningElement

            // Now go through and push any bodies in the current context to the stack
            try {
                switch (node.type) {
                    // From estree.d.ts
                    case "Program": {
                        fileContents = this.rewriteNodes(node.body, comments, fileContents);
                        break;
                    }
                    case "Function": {
                        nodes.push(node.body);
                        break;
                    }
                    case "BlockStatement": {
                        fileContents = this.rewriteNodes(node.body, comments, fileContents);
                        break;
                    }
                    case "ExpressionStatement": {
                        nodes.push(node.expression);
                        break;
                    }
                    case "IfStatement": {
                        nodes.push(node.test);
                        nodes.push(node.consequent);
                        if (node.alternate != null) {
                            nodes.push(node.alternate);
                        }
                        break;
                    }
                    case "LabeledStatement": {
                        nodes.push(node.body);
                        break;
                    }
                    case "WithStatement": {
                        nodes.push(node.object);
                        nodes.push(node.body);
                        break;
                    }
                    case "SwitchStatement": {
                        nodes.push(node.discriminant);
                        if (node.body != null) {
                            // See if we get in here... based on estree.d.ts we shouldn't
                            this.printHelpModeInfo(node, fileContents);
                            nodes.push(node.body);
                        }
                        // Sort the contents of the cases
                        fileContents = this.rewriteNodes(node.cases, comments, fileContents);
                        // Sort the cases
                        fileContents = sortSwitchCases(node.cases, comments, fileContents);
                        break;
                    }
                    case "ReturnStatement": {
                        if (node.argument) {
                            nodes.push(node.argument);
                        }
                        break;
                    }
                    case "ThrowStatement": {
                        if (node.argument) {
                            nodes.push(node.argument);
                        }
                        break;
                    }
                    case "TryStatement": {
                        nodes.push(node.block);
                        if (node.handler != null) {
                            nodes.push(node.handler.body);
                        }
                        if (node.finalizer != null) {
                            nodes.push(node.finalizer.body);
                        }
                        break;
                    }
                    case "WhileStatement":
                    case "DoWhileStatement": {
                        nodes.push(node.test);
                        nodes.push(node.body);
                        break;
                    }
                    case "ForStatement": {
                        if (node.init != null) {
                            nodes.push(node.init);
                        }
                        if (node.test != null) {
                            nodes.push(node.test);
                        }
                        if (node.update != null) {
                            nodes.push(node.update);
                        }
                        nodes.push(node.body);
                        break;
                    }
                    case "ForInStatement":
                    case "ForOfStatement": {
                        nodes.push(node.left);
                        nodes.push(node.right);
                        nodes.push(node.body);
                        break;
                    }
                    case "FunctionDeclaration": {
                        nodes.push(node.body);
                        break;
                    }
                    case "VariableDeclaration": {
                        // Sort the contents of each declarator
                        fileContents = this.rewriteNodes(node.declarations, comments, fileContents);
                        break;
                    }
                    case "VariableDeclarator": {
                        if (node.init != null) {
                            nodes.push(node.init);
                        }
                        break;
                    }
                    case "ArrayExpression": {
                        fileContents = this.rewriteNodes(node.elements, comments, fileContents);
                        break
                    }
                    case "ObjectExpression": {
                        // TODO sort the properties
                        fileContents = this.rewriteNodes(node.properties, comments, fileContents);
                        break;
                    }
                    case "Property": {
                        nodes.push(node.key);
                        nodes.push(node.value);
                        break;
                    }
                    case "FunctionExpression": {
                        nodes.push(node.body);
                        break;
                    }
                    case "SequenceExpression": {
                        this.printHelpModeInfo(node, fileContents);
                        fileContents = this.rewriteNodes(node.expressions, comments, fileContents);
                        break;
                    }
                    case "BinaryExpression": {
                        fileContents = sortExpression(node, comments, fileContents, this._options.sortTypeAnnotations && {
                            groups: this._options.sortTypeAnnotations,
                        });
                        break;
                    }
                    case "AssignmentExpression": {
                        // TODO ?
                        // nodes.push(node.left);
                        nodes.push(node.right);
                        break;
                    }
                    case "UpdateExpression": {
                        nodes.push(node.argument);
                        break;
                    }
                    case "LogicalExpression": {
                        nodes.push(node.left);
                        nodes.push(node.right);
                        break;
                    }
                    case "ConditionalExpression": {
                        nodes.push(node.test);
                        nodes.push(node.alternate);
                        nodes.push(node.consequent);
                        break;
                    }
                    case "CallExpression":
                    case "NewExpression": {
                        fileContents = this.rewriteNodes(node.arguments, comments, fileContents);
                        break;
                    }
                    case "MemberExpression": {
                        nodes.push(node.property);
                        break;
                    }
                    case "SwitchCase": {
                        fileContents = this.rewriteNodes(node.consequent, comments, fileContents);
                        break;
                    }
                    case "CatchClause": {
                        nodes.push(node.body);
                        break;
                    }
                    case "ArrowFunctionExpression": {
                        nodes.push(node.body);
                        break;
                    }
                    case "Class": {
                        // Fairly sure there is more in a class than just this
                        debugger;
                        nodes.push(node.body);
                        break;
                    }
                    case "ClassBody": {
                        // Fairly sure there is more in a class than just this
                        fileContents = this.rewriteNodes(node.body, comments, fileContents);
                        break;
                    }
                    case "MethodDefinition": {
                        nodes.push(node.value);
                        break;
                    }
                    case "ClassDeclaration":
                    case "ClassExpression": {
                        if (node.body != null) {
                            nodes.push(node.body);
                        } else if (node.declaration) {
                            // TODO this is either node.declaration or node.declaration.body
                            debugger;
                            nodes.push(node.declaration);
                        } else {
                            this.printHelpModeInfo(node, fileContents);
                        }
                        break;
                    }
                    case "ImportDeclaration": {
                        fileContents = sortImportDeclarationSpecifiers(node.specifiers, fileContents);
                        break;
                    }
                    case "ExportNamedDeclaration": {
                        nodes.push(node.declaration);
                        if (node.specifiers.length !== 0) {
                            this.printHelpModeInfo(node, fileContents);
                        }
                        break;
                    }
                    case "ThisExpression":
                    case "UnaryExpression ":
                    case "ContinueStatement":
                    case "EmptyStatement":
                    case "DebuggerStatement":
                    case "Literal":
                    case "Identifier":
                    case "BreakStatement": {
                        // Skip since there isn't anything for us to sort
                        break;
                    }

                    // JSX
                    case "JSXOpeningElement": {
                        fileContents = sortJsxElement(node, comments, fileContents);
                        break;
                    }

                    // From typescript or flow - TODO need to split these
                    case "TSPropertySignature": {
                        nodes.push(node.typeAnnotation);
                        break;
                    }
                    case "TypeAnnotation": {
                        nodes.push(node.typeAnnotation);
                        break;
                    }
                    case "InterfaceDeclaration": {
                        nodes.push(node.body);
                        break;
                    }
                    case "ObjectTypeAnnotation": {
                        fileContents = this.rewriteNodes(node.properties, comments, fileContents);
                        fileContents = sortObjectTypeAnnotation(node, comments, fileContents);
                        break;
                    }
                    case "ObjectTypeProperty": {
                        nodes.push(node.value);
                        break;
                    }
                    case "TSInterfaceDeclaration": {
                        nodes.push(node.body);
                        break;
                    }
                    case "TSInterfaceBody": {
                        fileContents = this.rewriteNodes(node.body, comments, fileContents);
                        break;
                    }
                    case "TypeAlias": {
                        nodes.push(node.right);
                        break;
                    }
                    case "UnionTypeAnnotation": {
                        fileContents = sortUnionTypeAnnotation(node, comments, fileContents, this._options.sortTypeAnnotations && {
                            groups: this._options.sortTypeAnnotations
                        });
                        break;
                    }
                    case "ClassProperty": {
                        if (node.typeAnnotation != null) {
                            nodes.push(node.typeAnnotation);
                        } else if (node.value == null) {
                            // No value to sort...
                        }
                        else if (node.value != null) {
                            nodes.push(node.value);
                        }
                        else {
                            this.printHelpModeInfo(node, fileContents);
                        }
                        break;
                    }
                    default:
                        this.printHelpModeInfo(node, fileContents);
                        break;
                }
            }
            catch (e) {
                this.printHelpModeInfo(node, fileContents);
                throw e;
            }
        }

        // Sorts that depend on other things sorting first
        if (this._options.sortImportDeclarations !== null) {
            fileContents = sortImportDeclarations(originalNodes, fileContents, this._options.sortImportDeclarations && {
                orderBy: this._options.sortImportDeclarations
            });
        }
        // TODO Function sort - https://github.com/bryanrsmith/eslint-plugin-sort-class-members

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
            throw new Error(`Could not read file: ${this._filename}\n${error.message}`);
        }
    }

    private writeFileContents(fileContents: string) {
        try {
            fs.writeFileSync(this._filename, fileContents, "utf8");
        } catch (error) {
            throw new Error(`Could not write file: ${this._filename}\n${error.message}`);
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