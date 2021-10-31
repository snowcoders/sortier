import { Comment } from "estree";

// Parsers
import { parse as parseFlow } from "../parsers/flow/index.js";
import { parse as parseTypescript } from "../parsers/typescript/index.js";

// Types of sorts
import { sortExpression } from "../sortExpression/index.js";
import {
  SortImportDeclarationSpecifiersOptions,
  sortImportDeclarationSpecifiers,
} from "../sortImportDeclarationSpecifiers/index.js";
import {
  SortImportDeclarationsOrderOption,
  sortImportDeclarations,
} from "../sortImportDeclarations/index.js";
import { sortJsxElement } from "../sortJsxElement/index.js";
import { sortObjectTypeAnnotation } from "../sortObjectTypeAnnotation/index.js";
import { sortSwitchCases } from "../sortSwitchCases/index.js";
import { sortTSPropertySignatures } from "../sortTSPropertySignatures/index.js";
import { sortUnionTypeAnnotation } from "../sortUnionTypeAnnotation/index.js";

// Utils
import { ILanguage } from "../../language.js";
import { ReprinterOptions as BaseReprinterOptions } from "../../reprinter-options.js";
import { ArrayUtils } from "../../utilities/array-utils.js";
import { LogUtils, LoggerVerboseOption } from "../../utilities/log-utils.js";
import { isIgnored } from "../../utilities/sort-utils.js";
import { StringUtils } from "../../utilities/string-utils.js";
import {
  SortClassContentsOptions,
  sortClassContents,
} from "../sortClassContents/index.js";
import { TypeAnnotationOption } from "../utilities/sort-utils.js";

export type ReprinterOptions = Partial<JsReprinterOptionsRequired>;

interface JsReprinterOptionsRequired {
  // Default undefined. The parser to use. If undefined, sortier will determine the parser to use based on the file extension
  parser?: "flow" | "typescript";
  // Default undefined. If defined, class contents will be sorted based on the options provided. Turned off by default because it will sort over blank lines.
  sortClassContents?: SortClassContentsOptions;
  // Default ["*", "interfaces", "types"] (see SortImportDeclarationSpecifiersOptions)
  sortImportDeclarationSpecifiers?: SortImportDeclarationSpecifiersOptions;
  // Default "source". The order you wish to sort import statements. Source is the path the import comes from. First specifier is the first item imported.
  sortImportDeclarations?: SortImportDeclarationsOrderOption;
  // Default ["undefined", "null", "*", "function"]. The order to sort object types when encountered.
  sortTypeAnnotations?: TypeAnnotationOption[];
}

export class Reprinter implements ILanguage {
  public static readonly EXTENSIONS = [
    ".cjs",
    ".js",
    ".js.txt",
    ".jsx",
    ".mjs",
    ".ts",
    ".tsx",
    ".ts.txt",
  ];

  // @ts-expect-error: Need to move to a functional system
  private _filename: string;
  // @ts-expect-error: Need to move to a functional system
  private _helpModeHasPrintedFilename: boolean;
  // @ts-expect-error: Need to move to a functional system
  private _options: JsReprinterOptionsRequired;

  public getRewrittenContents(
    filename: string,
    fileContents: string,
    options: BaseReprinterOptions
  ) {
    this._filename = filename;
    this._options = this.getValidatedOptions(options);
    this._helpModeHasPrintedFilename = false;

    const parser = this.getParser();
    const ast = parser(fileContents);
    const comments: Comment[] = ast.comments;

    return this.rewriteNodes([ast], comments, fileContents);
  }

  public isFileSupported(filename: string) {
    return StringUtils.stringEndsWithAny(filename, [...Reprinter.EXTENSIONS]);
  }

  private getValidatedOptions(
    appOptions: BaseReprinterOptions
  ): JsReprinterOptionsRequired {
    const partialOptions = appOptions.js || {};
    let sortTypeAnnotations: undefined | Array<TypeAnnotationOption> =
      undefined;
    if (partialOptions.sortTypeAnnotations != null) {
      sortTypeAnnotations = partialOptions.sortTypeAnnotations.slice();
      ArrayUtils.dedupe(sortTypeAnnotations);
    }

    return {
      ...partialOptions,
      sortTypeAnnotations,
    };
  }

  private getParser() {
    // If the options overide the parser type
    if (this._options.parser === "flow") {
      return parseFlow;
    }

    // Make sure typescript can handle the extension
    const isSupportedFileExtension = StringUtils.stringEndsWithAny(
      this._filename,
      Reprinter.EXTENSIONS
    );
    if (isSupportedFileExtension) {
      return parseTypescript;
    }

    throw new Error("File not supported");
  }

  private rewriteNodes(
    originalNodes: any[],
    comments: Comment[],
    fileContents: string
  ) {
    let lastClassName = undefined;
    const nodes = originalNodes.slice();
    while (nodes.length !== 0) {
      const node = nodes.shift();
      if (Array.isArray(node)) {
        throw new Error(
          "Unexpected Exception - Array sent as node in rewrite nodes"
        );
      }
      if (node == null) {
        throw new Error("Unexpected Exception - Node received is null");
      }

      if (isIgnored(fileContents, comments, node)) {
        continue;
      }
      // Now go through and push any bodies in the current context to the stack
      try {
        switch (node.type) {
          // From estree.d.ts
          case "ArrayExpression":
          case "ArrayPattern": {
            fileContents = this.rewriteNodes(
              node.elements.filter((value: any) => value != null),
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
            fileContents = sortExpression(node, comments, fileContents, {
              groups: this._options.sortTypeAnnotations,
            });
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
          case "OptionalMemberExpression":
          case "Super":
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
          case "ClassBody": {
            fileContents = this.rewriteNodes(node.body, comments, fileContents);

            const sortClassContentsOptions = this._options.sortClassContents;
            if (sortClassContentsOptions != null) {
              // TODO Fairly sure there is more in a class than just this
              fileContents = sortClassContents(
                lastClassName,
                node.body,
                comments,
                fileContents,
                sortClassContentsOptions
              );
            }
            break;
          }
          case "ClassDeclaration":
          case "ClassExpression": {
            if (node.id != null) {
              lastClassName = node.id.name;
            }
            if (node.body != null) {
              nodes.push(node.body);
            } else {
              this.printHelpModeInfo(node, fileContents);
            }
            break;
          }
          case "ClassProperty":
          case "PropertyDefinition": {
            if (node.typeAnnotation != null) {
              nodes.push(node.typeAnnotation);
            }
            if (node.value != null) {
              nodes.push(node.value);
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
                comments,
                fileContents,
                this._options.sortImportDeclarationSpecifiers
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
            if (node.body != null) {
              nodes.push(node.body);
            }
            break;
          }
          case "Identifier":
          case "TSParenthesizedType":
          case "TSPropertySignature":
          case "TSTypeAliasDeclaration":
          case "TSTypeAnnotation":
          case "TypeAnnotation": {
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
              comments,
              fileContents,
              this._options.sortImportDeclarationSpecifiers
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
              {
                groups: this._options.sortTypeAnnotations,
              }
            );
            break;
          }
          case "Program": {
            fileContents = this.rewriteNodes(node.body, comments, fileContents);

            // Sort imports after as the previous line will sort the ImportSpecifiers
            fileContents = sortImportDeclarations(
              node,
              comments,
              fileContents,
              this._options.sortImportDeclarations && {
                orderBy: this._options.sortImportDeclarations,
              }
            );
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
          case "SpreadElement":
          case "SpreadProperty": {
            nodes.push(node.argument);
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
              nodes.push(node.handler);
            }
            if (node.finalizer != null) {
              nodes.push(node.finalizer);
            }
            break;
          }
          case "TypeCastExpression": {
            nodes.push(node.expression);
            nodes.push(node.typeAnnotation);
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
          case "JSXFragment":
          case "JSXOpeningElement": {
            fileContents = this.rewriteNodes(
              node.children,
              comments,
              fileContents
            );
            fileContents = sortJsxElement(node, comments, fileContents);
            break;
          }
          case "JSXEmptyExpression":
          case "JSXText": {
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
          case "TSConditionalType":
          case "TSConstructorType":
          case "TSEnumDeclaration":
          case "TSImportType":
          case "TSIndexSignature":
          case "TSIndexedAccessType":
          case "TSLastTypeNode":
          case "TSLiteralType":
          case "TSMappedType":
          case "TSNonNullExpression":
          case "TSNullKeyword":
          case "TSNumberKeyword":
          case "TSObjectKeyword":
          case "TSStringKeyword":
          case "TSTypeOperator":
          case "TSTypeQuery":
          case "TSTypeReference":
          case "TSUndefinedKeyword":
          case "TSVoidKeyword": {
            break;
          }
          case "RestElement":
          case "RestProperty": {
            if (node.argument) {
              nodes.push(node.argument);
            }
            if (node.typeAnnotation) {
              nodes.push(node.typeAnnotation);
            }
            break;
          }
          case "TSDeclareFunction":
          case "TSFunctionType":
          case "TSMethodSignature": {
            if (node.params != null && node.params.length !== 0) {
              fileContents = this.rewriteNodes(
                node.params,
                comments,
                fileContents
              );
            }
            if (node.returnType != null) {
              nodes.push(node.returnType);
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
            if (node.body != null) {
              nodes.push(node.body);
            }
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
              {
                groups: this._options.sortTypeAnnotations,
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
              {
                groups: this._options.sortTypeAnnotations,
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
              {
                groups: this._options.sortTypeAnnotations,
              }
            );
            break;
          }

          // From typescript or flow - TODO need to split these
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
              {
                groups: this._options.sortTypeAnnotations,
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
              {
                groups: this._options.sortTypeAnnotations,
              }
            );
            break;
          }
          case "TSInterfaceDeclaration": {
            nodes.push(node.body);
            break;
          }
          case "TSIntersectionType": {
            fileContents = this.rewriteNodes(
              node.types,
              comments,
              fileContents
            );
            fileContents = sortUnionTypeAnnotation(
              node,
              comments,
              fileContents,
              {
                groups: this._options.sortTypeAnnotations,
              }
            );
            break;
          }
          case "TypeAlias": {
            nodes.push(node.right);
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
              {
                groups: this._options.sortTypeAnnotations,
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

    return fileContents;
  }

  private printHelpModeInfo(item: any, fileContents: string) {
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
