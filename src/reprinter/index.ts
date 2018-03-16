import * as fs from "fs";

// Parsers
import { parse as parseFlow } from "../parsers/flow";
import { parse as parseTypescript } from "../parsers/typescript";

// Types of sorts
import { sortExpression, SortExpressionOptions } from "../sortExpression";
import { sortImportDeclarations, SortImportDeclarationsOptions } from "../sortImportDeclarations";
import { sortImportDeclarationSpecifiers, SortImportDeclarationSpecifiersOptions } from "../sortImportDeclarationSpecifiers";
import { sortSwitchCase, SortSwitchCaseOptions } from "../sortSwitchCase";
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
    sortSwitchCase?: null | SortSwitchCaseOptions,
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
        let nodes = [ast];
        debugger;

        while (nodes.length !== 0) {
            let node = nodes.pop();
            if (node == null) {
                continue;
            }

            // TODO ObjectExpression
            // TODO ObjectPattern
            // TODO JSXOpeningElement
            // TODO ObjectTypeAnnotation
            // TODO SwitchStatement

            // Now go through and push any bodies in the current context to the stack
            try {
                switch (node.type) {
                    case "Program": {
                        nodes.push(node.body);
                        break;
                    }
                    case "Function": {
                        nodes.push(node.body);
                        break;
                    }
                    case "BlockStatement": {
                        nodes.push(node.body);
                        break;
                    }
                    case "ExpressionStatement": {
                        // TODO possibly sortExpression on node.expression (Type is Expression)
                        break;
                    }
                    case "IfStatement": {
                        // TODO possibly sortExpression on node.test (Type is Expression)
                        if (node.consequent.body != null) {
                            nodes.push(node.consequent);
                        }
                        if (node.alternate.body != null) {
                            nodes.push(node.consequent);
                        }
                        break;
                    }
                    case "LabeledStatement": {
                        nodes.push(node.body);
                        break;
                    }
                    case "WithStatement": {
                        // TODO possibly sortExpression on node.object (Type is Expression)
                        nodes.push(node.body);
                        break;
                    }
                    case "SwitchStatement": {
                        // TODO possibly sortExpression on node.discriminant (Type is Expression)
                        if (node.body != null) {
                            // See if we get in here... based on estree.d.ts we shouldn't
                            debugger;
                            nodes.push(node.body);
                        }
                        if (this._options.sortSwitchCase !== null) {
                            // TODO need to go into each switch statement and sort the contents before
                            // sorting the cases
                            fileContents = sortSwitchCase(node.cases, comments, fileContents, this._options.sortSwitchCase);
                        }
                        break;
                    }
                    case "ReturnStatement": {
                        if (node.argument != null && this._options.sortExpression !== null) {
                            fileContents = sortExpression(node.argument, comments, fileContents, this._options.sortExpression);
                        }
                        break;
                    }
                    case "ThrowStatement": {
                        if (node.argument != null && this._options.sortExpression !== null) {
                            fileContents = sortExpression(node.argument, comments, fileContents, this._options.sortExpression);
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
                        // TODO possibly sortExpression on node.test (Type is Expression)
                        nodes.push(node.body);
                        break;
                    }
                    case "ForStatement": {
                        // TODO possibly sortExpression or sortVariableDeclaration on node.init? (Type is Expression | VariableDeclaration)
                        // TODO possibly sortExpression on node.test (Type is Expression)
                        // TODO possibly sortExpression on node.update (Type is Expression)
                        nodes.push(node.body);
                        break;
                    }
                    case "ForInStatement":
                    case "ForOfStatement": {
                        // TODO possibly sortExpression or sortVariableDeclaration on node.let (Type is Expression | VariableDeclaration)
                        // TODO possibly sortExpression on node.right (Type is Expression)
                        nodes.push(node.body);
                        break;
                    }
                    case "FunctionDeclaration": {
                        nodes.push(node.body);
                        break;
                    }
                    case "VariableDeclaration": {
                        if (this._options.sortVariableDeclarator !== null) {
                            fileContents = sortVariableDeclarator(node, comments, fileContents, this._options.sortVariableDeclarator);
                        }
                        break;
                    }
                    case "ObjectExpression": {
                        // TODO sort the properties
                        nodes.push(node.properties);
                        break;
                    }
                    case "Property": {
                        // TODO possibly sortExpression on node.key (Type is Expression)
                        // TODO possibly sortExpression on node.value (Type is Expression)
                        break;
                    }
                    case "FunctionExpression": {
                        nodes.push(node.body);
                        break;
                    }
                    case "SequenceExpression": {
                        // TODO verify
                        debugger;
                        nodes.push(node.expressions);
                        break;
                    }
                    case "SwitchCase": {
                        nodes.push(node.consequent);
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
                    // TODO Figure out what Patterns are and maybe sort them
                    case "Class": {
                        // Fairly sure there is more in a class than just this
                        debugger;
                        nodes.push(node.body);
                        break;
                    }
                    case "ClassBody": {
                        // Fairly sure there is more in a class than just this
                        debugger;
                        nodes.push(node.body);
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
                        if (this._options.sortImportDeclarationSpecifiers !== null) {
                            fileContents = sortImportDeclarationSpecifiers(node.specifiers, fileContents, this._options.sortImportDeclarationSpecifiers);
                        }
                        break;
                    }
                    case "ExportNamedDeclaration": {
                        nodes.push(node.declaration);
                        break;
                    }


                    case "TSPropertySignature": {
                        if (this._options.sortUnionTypeAnnotation !== null) {
                            fileContents = sortTSUnionTypeAnnotation(node.typeAnnotation, comments, fileContents, this._options.sortUnionTypeAnnotation);
                        }
                        break;
                    }
                    case "InterfaceDeclaration": {
                        nodes.push(node.body);
                        break;
                    }
                    case "ObjectTypeAnnotation": {
                        nodes.push(node.properties);
                        break;
                    }
                    case "ObjectTypeProperty": {
                        if (this._options.sortUnionTypeAnnotation !== null) {
                            fileContents = sortUnionTypeAnnotation(node.value, comments, fileContents, this._options.sortUnionTypeAnnotation);
                        }
                        break;
                    }
                    case "TSInterfaceDeclaration": {
                        debugger; // Figure out type of body and see if we can just push that instead
                        nodes.push(node.body.body);
                        break;
                    }
                    case "TypeAlias": {
                        if (node.right.type === "UnionTypeAnnotation") {
                            if (this._options.sortUnionTypeAnnotation !== null) {
                                fileContents = sortUnionTypeAnnotation(node.right, comments, fileContents, this._options.sortUnionTypeAnnotation);
                            }
                        } else if (node.right.type === "ObjectTypeAnnotation") {
                            nodes.push(node.right);
                        } else {
                            this.printHelpModeInfo(node, fileContents);
                        }
                        break;
                    }
                    case "ClassProperty": {
                        if (node.typeAnnotation && node.typeAnnotation.type === "TypeAnnotation" && node.typeAnnotation.typeAnnotation.type === "UnionTypeAnnotation") {
                            if (this._options.sortUnionTypeAnnotation !== null) {
                                fileContents = sortUnionTypeAnnotation(node.typeAnnotation.typeAnnotation, comments, fileContents, this._options.sortUnionTypeAnnotation);
                            }
                            else {
                                this.printHelpModeInfo(node, fileContents);
                            }
                        } else if (node.value == null) {
                            // No value to sort...
                            break;
                        }
                        else if (node.value && node.value.body && node.value.body.body) {
                            nodes.push(node.value.body.body);
                        }
                        else if ("ArrayExpression") {
                            // TODO - Array expression
                        }
                        else {
                            this.printHelpModeInfo(node, fileContents);
                        }
                        break;
                    }
                    case "ContinueStatement":
                    case "EmptyStatement":
                    case "BreakStatement": {
                        // Skip since there isn't anything for us to sort
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
            fileContents = sortImportDeclarations(ast, fileContents, this._options.sortImportDeclarations);
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