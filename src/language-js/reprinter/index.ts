import { Comment } from "estree";

// Parsers
import { parse as parseFlow } from "../parsers/flow/index.js";
import { parse as parseTypescript } from "../parsers/typescript/index.js";

// Types of sorts
import {
  SortImportDeclarationSpecifiersOptions,
  sortImportDeclarationSpecifiers,
} from "../sortImportDeclarationSpecifiers/index.js";
import { SortImportDeclarationsOrderOption, sortImportDeclarations } from "../sortImportDeclarations/index.js";
import { sortJsxElement } from "../sortJsxElement/index.js";
import { sortObjectTypeAnnotation } from "../sortObjectTypeAnnotation/index.js";
import { sortSwitchCases } from "../sortSwitchCases/index.js";
import { sortTSPropertySignatures } from "../sortTSPropertySignatures/index.js";
import { sortUnionTypeAnnotation } from "../sortUnionTypeAnnotation/index.js";
import { SortContentsOptions, sortContents } from "../sortContents/index.js";

// Utils
import { SortierOptions as BaseSortierOptions } from "../../config/index.js";
import { ILanguage } from "../../language.js";
import { ArrayUtils } from "../../utilities/array-utils.js";
import { LogUtils, LoggerVerboseOption } from "../../utilities/log-utils.js";
import { isIgnored } from "../../utilities/sort-utils.js";
import { StringUtils } from "../../utilities/string-utils.js";
import { TypeAnnotationOption } from "../utilities/sort-utils.js";

export type SortierOptions = Partial<JsSortierOptionsRequired>;

interface JsSortierOptionsRequired {
  // Default undefined. The parser to use. If undefined, sortier will determine the parser to use based on the file extension
  parser?: "flow" | "typescript";
  // Default undefined. If defined, class contents will be sorted based on the options provided. Turned off by default because it will sort over blank lines.
  sortContents?: SortContentsOptions;
  // Default ["*", "interfaces", "types"] (see SortImportDeclarationSpecifiersOptions)
  sortImportDeclarationSpecifiers?: SortImportDeclarationSpecifiersOptions;
  // Default "source". The order you wish to sort import statements. Source is the path the import comes from. First specifier is the first item imported.
  sortImportDeclarations?: SortImportDeclarationsOrderOption;
  // Default ["undefined", "null", "*", "function"]. The order to sort object types when encountered.
  sortTypeAnnotations?: TypeAnnotationOption[];
}

export class Reprinter implements ILanguage {
  public static readonly EXTENSIONS = [".cjs", ".js", ".js.txt", ".jsx", ".mjs", ".ts", ".tsx", ".ts.txt"];

  // @ts-expect-error: Need to move to a functional system
  private _filename: string;
  // @ts-expect-error: Need to move to a functional system
  private _helpModeHasPrintedFilename: boolean;
  // @ts-expect-error: Need to move to a functional system
  private _options: JsSortierOptionsRequired;

  public getRewrittenContents(filename: string, fileContents: string, options: BaseSortierOptions) {
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

  private getValidatedOptions(appOptions: BaseSortierOptions): JsSortierOptionsRequired {
    const partialOptions = appOptions.js || {};
    let sortTypeAnnotations: undefined | Array<TypeAnnotationOption> = undefined;
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
    const isSupportedFileExtension = StringUtils.stringEndsWithAny(this._filename, Reprinter.EXTENSIONS);
    if (isSupportedFileExtension) {
      return parseTypescript;
    }

    throw new Error("File not supported");
  }

  private rewriteNodes(originalNodes: any[], comments: Comment[], fileContents: string) {
    let lastClassName = undefined;
    const nodes = originalNodes.slice();
    while (nodes.length !== 0) {
      const node = nodes.shift();
      if (Array.isArray(node)) {
        throw new Error("Unexpected Exception - Array sent as node in rewrite nodes");
      }
      if (node == null) {
        throw new Error("Unexpected Exception - Node received is null");
      }

      if (isIgnored(fileContents, comments, node)) {
        continue;
      }
      // Now go through and push any bodies in the current context to the stack
      try {
        const diveProperties = [
          "alternate",
          "argument",
          "arguments",
          "block",
          "body",
          "callee",
          "cases",
          "children",
          "consequent",
          "declaration",
          "declarations",
          "discriminant",
          "elements",
          "elementTypes",
          "expression",
          "expressions",
          "finalizer",
          "handler",
          "id",
          "init",
          "key",
          "left",
          "members",
          "object",
          "params",
          "properties",
          "property",
          "returnType",
          "right",
          "test",
          "typeAnnotation",
          "typeParameters",
          "types",
          "update",
          "value",
        ];
        for (const diveProperty of diveProperties) {
          const value = node[diveProperty];
          const unFilteredPropertyArray = Array.isArray(value) ? value : [value];
          const actionablePropertyArray = unFilteredPropertyArray.filter((value: any) => {
            return value != null && value.type != null;
          });
          if (actionablePropertyArray.length === 0) {
            continue;
          }
          fileContents = this.rewriteNodes(actionablePropertyArray, comments, fileContents);
        }

        switch (node.type) {
          case "ClassBody": {
            const sortContentsOptions = this._options.sortContents;
            if (sortContentsOptions != null) {
              fileContents = sortContents(lastClassName, node.body, comments, fileContents, sortContentsOptions);
            }
            break;
          }
          case "ClassDeclaration":
          case "ClassExpression": {
            if (node.id != null) {
              lastClassName = node.id.name;
            }
            break;
          }
          case "ExportNamedDeclaration":
          case "ImportDeclaration": {
            if (node.specifiers.length > 1) {
              fileContents = sortImportDeclarationSpecifiers(
                node.specifiers,
                comments,
                fileContents,
                this._options.sortImportDeclarationSpecifiers
              );
            }
            break;
          }
          case "IntersectionTypeAnnotation":
          case "TSIntersectionType":
          case "TSUnionType":
          case "UnionTypeAnnotation": {
            fileContents = sortUnionTypeAnnotation(node, comments, fileContents, {
              groups: this._options.sortTypeAnnotations,
            });
            break;
          }
          case "JSXElement":
          case "JSXFragment":
          case "JSXOpeningElement": {
            fileContents = sortJsxElement(node, comments, fileContents);
            break;
          }
          case "ObjectExpression":
          case "ObjectPattern":
          case "ObjectTypeAnnotation": {
            fileContents = sortObjectTypeAnnotation(node, comments, fileContents, {
              groups: this._options.sortTypeAnnotations,
            });
            break;
          }
          case "Program": {
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
          case "SwitchStatement": {
            fileContents = sortSwitchCases(node.cases, comments, fileContents);
            break;
          }
          case "TSInterfaceBody": {
            fileContents = sortTSPropertySignatures(node.body, comments, fileContents, {
              groups: this._options.sortTypeAnnotations,
            });
            break;
          }
          case "TSTypeLiteral": {
            fileContents = sortTSPropertySignatures(node.members, comments, fileContents, {
              groups: this._options.sortTypeAnnotations,
            });
            break;
          }
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
      ` - ${item.type} - ${JSON.stringify(item.loc.start)} - ${JSON.stringify(item.loc.end)}`
    );
    LogUtils.log(LoggerVerboseOption.Diagnostic, fileContents.substring(item.range[0], item.range[1]));
  }
}
