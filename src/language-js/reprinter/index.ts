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
import { sortTSPropertySignatures } from "../sortTSPropertySignatures";
import { sortUnionTypeAnnotation } from "../sortUnionTypeAnnotation";

// Utils
import { isArray } from "util";
import { ILanguage } from "../../language";
import { ReprinterOptions } from "../../reprinter-options";
import { LoggerVerboseOption, LogUtils } from "../../utilities/log-utils";
import { StringUtils } from "../../utilities/string-utils";

export class Reprinter implements ILanguage {
  public static readonly TYPESCRIPT_EXTENSIONS = [".ts", ".tsx", ".ts.txt"];
  public static readonly JAVASCRIPT_EXTENSIONS = [".js", ".jsx", ".js.txt"];

  private _filename: string;
  private _options: ReprinterOptions;
  private _helpModeHasPrintedFilename: boolean;

  public isFileSupported(filename: string) {
    return StringUtils.stringEndsWithAny(filename, [
      ...Reprinter.JAVASCRIPT_EXTENSIONS,
      ...Reprinter.TYPESCRIPT_EXTENSIONS
    ]);
  }

  public getRewrittenContents(
    filename: string,
    fileContents: string,
    options: ReprinterOptions
  ) {
    this._filename = filename;
    this._options = options;
    this._helpModeHasPrintedFilename = false;

    let parser = this.getParser();
    let ast = parser(fileContents);
    let comments: Comment[] = ast.comments;

    return this.rewriteNodes([ast], comments, fileContents);
  }

  private rewriteNodes(
    originalNodes: any[],
    comments: Comment[],
    fileContents: string
  ) {
    let nodes = originalNodes.slice();
    while (nodes.length !== 0) {
      let node = nodes.shift();
      if (isArray(node)) {
        throw new Error(
          "Unexpected Exception - Array sent as node in rewrite nodes"
        );
      }
      if (node == null) {
        throw new Error("Unexpected Exception - Node received is null");
      }

      // Now go through and push any bodies in the current context to the stack
      try {
        switch (node.type) {
          // From estree.d.ts
          case "ArrayExpression": {
            fileContents = this.rewriteNodes(
              node.elements,
              comments,
              fileContents
            );
            break;
          }
          case "ArrowFunctionExpression": {
            fileContents = this.rewriteNodes(
              node.params,
              comments,
              fileContents
            );
            nodes.push(node.body);
            break;
          }
          case "AssignmentExpression": {
            // TODO ?
            // nodes.push(node.left);
            nodes.push(node.right);
            break;
          }
          case "BinaryExpression": {
            fileContents = sortExpression(
              node,
              comments,
              fileContents,
              this._options.sortTypeAnnotations && {
                groups: this._options.sortTypeAnnotations
              }
            );
            break;
          }
          case "BlockStatement": {
            fileContents = this.rewriteNodes(node.body, comments, fileContents);
            break;
          }
          case "BreakStatement":
          case "ContinueStatement":
          case "DebuggerStatement":
          case "EmptyStatement":
          case "Literal":
          case "RestProperty":
          case "SpreadElement":
          case "TaggedTemplateExpression":
          case "TemplateLiteral":
          case "ThisExpression":
          case "UnaryExpression":
          case "VoidTypeAnnotation": {
            // Skip since there isn't anything for us to sort
            break;
          }
          case "CallExpression":
          case "NewExpression": {
            fileContents = this.rewriteNodes(
              node.arguments,
              comments,
              fileContents
            );
            nodes.push(node.callee);
            break;
          }
          case "CatchClause": {
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
          case "ConditionalExpression": {
            nodes.push(node.test);
            nodes.push(node.alternate);
            nodes.push(node.consequent);
            break;
          }
          case "DoWhileStatement":
          case "WhileStatement": {
            nodes.push(node.test);
            nodes.push(node.body);
            break;
          }
          case "ExportAllDeclaration": {
            break;
          }
          case "ExportDefaultDeclaration": {
            nodes.push(node.declaration);
            break;
          }
          case "ExportNamedDeclaration": {
            if (node.declaration != null) {
              nodes.push(node.declaration);
            }
            if (node.specifiers.length !== 0) {
              fileContents = sortImportDeclarationSpecifiers(
                node.specifiers,
                fileContents
              );
            }
            break;
          }
          case "ExpressionStatement":
          case "JSXExpressionContainer": {
            nodes.push(node.expression);
            break;
          }
          case "ForInStatement":
          case "ForOfStatement": {
            nodes.push(node.left);
            nodes.push(node.right);
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
          case "Function": {
            nodes.push(node.body);
            break;
          }
          case "FunctionDeclaration": {
            if (node.params != null && node.params.length !== 0) {
              fileContents = this.rewriteNodes(
                node.params,
                comments,
                fileContents
              );
            }
            if (node.body != null) {
              nodes.push(node.body);
            }
            if (node.returnType != null) {
              nodes.push(node.returnType);
            }
            break;
          }
          case "FunctionExpression": {
            nodes.push(node.body);
            break;
          }
          case "Identifier": {
            if (node.typeAnnotation != null) {
              nodes.push(node.typeAnnotation);
            }
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
          case "ImportDeclaration": {
            fileContents = sortImportDeclarationSpecifiers(
              node.specifiers,
              fileContents
            );
            break;
          }
          case "LabeledStatement": {
            nodes.push(node.body);
            break;
          }
          case "LogicalExpression": {
            nodes.push(node.left);
            nodes.push(node.right);
            break;
          }
          case "MemberExpression": {
            nodes.push(node.object);
            nodes.push(node.property);
            break;
          }
          case "MethodDefinition": {
            nodes.push(node.value);
            break;
          }
          case "ObjectExpression":
          case "ObjectPattern": {
            fileContents = this.rewriteNodes(
              node.properties,
              comments,
              fileContents
            );
            fileContents = sortObjectTypeAnnotation(
              node,
              comments,
              fileContents,
              this._options.sortTypeAnnotations && {
                groups: this._options.sortTypeAnnotations
              }
            );
            break;
          }
          case "Program": {
            fileContents = this.rewriteNodes(node.body, comments, fileContents);
            break;
          }
          case "Property": {
            nodes.push(node.key);
            nodes.push(node.value);
            break;
          }
          case "ReturnStatement": {
            if (node.argument) {
              nodes.push(node.argument);
            }
            break;
          }
          case "SequenceExpression": {
            fileContents = this.rewriteNodes(
              node.expressions,
              comments,
              fileContents
            );
            break;
          }
          case "SwitchCase": {
            fileContents = this.rewriteNodes(
              node.consequent,
              comments,
              fileContents
            );
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
            fileContents = this.rewriteNodes(
              node.cases,
              comments,
              fileContents
            );
            // Sort the cases
            fileContents = sortSwitchCases(node.cases, comments, fileContents);
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
              nodes.push(node.finalizer);
            }
            break;
          }
          case "UpdateExpression": {
            nodes.push(node.argument);
            break;
          }
          case "VariableDeclaration": {
            // Sort the contents of each declarator
            fileContents = this.rewriteNodes(
              node.declarations,
              comments,
              fileContents
            );
            break;
          }
          case "VariableDeclarator": {
            if (node.id != null) {
              nodes.push(node.id);
            }
            if (node.init != null) {
              nodes.push(node.init);
            }
            break;
          }
          case "WithStatement": {
            nodes.push(node.object);
            nodes.push(node.body);
            break;
          }

          // JSX
          case "JSXElement":
          case "JSXOpeningElement": {
            fileContents = this.rewriteNodes(
              node.children,
              comments,
              fileContents
            );
            fileContents = sortJsxElement(node, comments, fileContents);
            break;
          }

          // Typescript
          case "AssignmentPattern": {
            if (node.left) {
              nodes.push(node.left);
            }
            if (node.right) {
              nodes.push(node.right);
            }
            break;
          }
          case "ExperimentalSpreadProperty":
          case "TSAnyKeyword":
          case "TSArrayType":
          case "TSAsExpression":
          case "TSBooleanKeyword":
          case "TSConstructorType":
          case "TSEnumDeclaration":
          case "TSIndexedAccessType":
          case "TSIndexSignature":
          case "TSLastTypeNode":
          case "TSLiteralType":
          case "TSMappedType":
          case "TSNonNullExpression":
          case "TSNullKeyword":
          case "TSNumberKeyword":
          case "TSParenthesizedType":
          case "TSStringKeyword":
          case "TSTypeOperator":
          case "TSTypeQuery":
          case "TSTypeReference":
          case "TSUndefinedKeyword":
          case "TSVoidKeyword": {
            break;
          }
          case "RestElement": {
            if (node.argument) {
              nodes.push(node.argument);
            }
            break;
          }
          case "TSFunctionType":
          case "TSMethodSignature": {
            if (node.params != null && node.params.length !== 0) {
              fileContents = this.rewriteNodes(
                node.params,
                comments,
                fileContents
              );
            }
            if (node.typeAnnotation != null) {
              nodes.push(node.typeAnnotation);
            }
            break;
          }
          case "TSModuleBlock": {
            fileContents = this.rewriteNodes(node.body, comments, fileContents);
            break;
          }
          case "TSModuleDeclaration": {
            nodes.push(node.body);
            break;
          }
          case "TSTupleType": {
            if (node.elementTypes != null) {
              fileContents = this.rewriteNodes(
                node.elementTypes,
                comments,
                fileContents
              );
            }
            break;
          }
          case "TSTypeAnnotation": {
            nodes.push(node.typeAnnotation);
            break;
          }
          case "TSTypeLiteral": {
            fileContents = this.rewriteNodes(
              node.members,
              comments,
              fileContents
            );
            fileContents = sortTSPropertySignatures(
              node.members,
              comments,
              fileContents,
              this._options.sortTypeAnnotations && {
                groups: this._options.sortTypeAnnotations
              }
            );
            break;
          }
          case "TSUnionType": {
            fileContents = this.rewriteNodes(
              node.types,
              comments,
              fileContents
            );
            fileContents = sortUnionTypeAnnotation(
              node,
              comments,
              fileContents,
              this._options.sortTypeAnnotations && {
                groups: this._options.sortTypeAnnotations
              }
            );
            break;
          }

          // Flow
          case "AnyTypeAnnotation":
          case "ArrayTypeAnnotation":
          case "BooleanLiteralTypeAnnotation":
          case "BooleanTypeAnnotation":
          case "GenericTypeAnnotation":
          case "NullLiteralTypeAnnotation":
          case "NumberLiteralTypeAnnotation":
          case "NumberTypeAnnotation":
          case "StringLiteralTypeAnnotation":
          case "StringTypeAnnotation": {
            if (
              node.typeParameters != null &&
              node.typeParameters.params != null
            ) {
              fileContents = this.rewriteNodes(
                node.typeParameters.params,
                comments,
                fileContents
              );
            }
            break;
          }
          case "FunctionTypeAnnotation": {
            if (node.returnType != null) {
              nodes.push(node.returnType);
            }
            break;
          }
          case "IntersectionTypeAnnotation": {
            fileContents = this.rewriteNodes(
              node.types,
              comments,
              fileContents
            );
            fileContents = sortUnionTypeAnnotation(
              node,
              comments,
              fileContents,
              this._options.sortTypeAnnotations && {
                groups: this._options.sortTypeAnnotations
              }
            );
            break;
          }

          // From typescript or flow - TODO need to split these
          case "ClassProperty": {
            if (node.typeAnnotation != null) {
              nodes.push(node.typeAnnotation);
            } else if (node.value == null) {
              // No value to sort...
            } else if (node.value != null) {
              nodes.push(node.value);
            } else {
              this.printHelpModeInfo(node, fileContents);
            }
            break;
          }
          case "InterfaceDeclaration": {
            nodes.push(node.body);
            break;
          }
          case "ObjectTypeAnnotation": {
            fileContents = this.rewriteNodes(
              node.properties,
              comments,
              fileContents
            );
            fileContents = sortObjectTypeAnnotation(
              node,
              comments,
              fileContents,
              this._options.sortTypeAnnotations && {
                groups: this._options.sortTypeAnnotations
              }
            );
            break;
          }
          case "ObjectTypeProperty": {
            nodes.push(node.value);
            break;
          }
          case "TSInterfaceBody": {
            fileContents = this.rewriteNodes(node.body, comments, fileContents);
            fileContents = sortTSPropertySignatures(
              node.body,
              comments,
              fileContents,
              this._options.sortTypeAnnotations && {
                groups: this._options.sortTypeAnnotations
              }
            );
            break;
          }
          case "TSInterfaceDeclaration": {
            nodes.push(node.body);
            break;
          }
          case "TSPropertySignature": {
            nodes.push(node.typeAnnotation);
            break;
          }
          case "TypeAlias": {
            nodes.push(node.right);
            break;
          }
          case "TypeAnnotation": {
            nodes.push(node.typeAnnotation);
            break;
          }
          case "UnionTypeAnnotation": {
            fileContents = this.rewriteNodes(
              node.types,
              comments,
              fileContents
            );
            fileContents = sortUnionTypeAnnotation(
              node,
              comments,
              fileContents,
              this._options.sortTypeAnnotations && {
                groups: this._options.sortTypeAnnotations
              }
            );
            break;
          }
          default:
            this.printHelpModeInfo(node, fileContents);
            break;
        }
      } catch (e) {
        this.printHelpModeInfo(node, fileContents);
        throw e;
      }
    }

    // Sorts that depend on other things sorting first
    if (this._options.sortImportDeclarations !== null) {
      fileContents = sortImportDeclarations(
        originalNodes,
        fileContents,
        this._options.sortImportDeclarations && {
          orderBy: this._options.sortImportDeclarations
        }
      );
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
    let isTypescript = StringUtils.stringEndsWithAny(
      this._filename,
      Reprinter.TYPESCRIPT_EXTENSIONS
    );
    if (isTypescript) {
      return parseTypescript;
    }

    let isJavascript = StringUtils.stringEndsWithAny(
      this._filename,
      Reprinter.JAVASCRIPT_EXTENSIONS
    );
    if (isJavascript) {
      return parseFlow;
    }

    throw new Error("File not supported");
  }

  private printHelpModeInfo(item, fileContents: string) {
    if (this._options.isHelpMode === true) {
      if (!this._helpModeHasPrintedFilename) {
        LogUtils.log(LoggerVerboseOption.Diagnostic, "");
        LogUtils.log(LoggerVerboseOption.Diagnostic, this._filename);
      }

      LogUtils.log(
        LoggerVerboseOption.Diagnostic,
        ` - ${item.type} - ${JSON.stringify(item.loc.start)} - ${JSON.stringify(
          item.loc.end
        )}`
      );
      LogUtils.log(
        LoggerVerboseOption.Diagnostic,
        fileContents.substring(item.range[0], item.range[1])
      );
    }
  }
}
