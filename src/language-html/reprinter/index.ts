import { parse } from "angular-html-parser/lib/angular-html-parser/src/index.js";
import { SortierOptions as BaseSortierOptions } from "../../config/index.js";
import { CssReprinter } from "../../language-css/index.js";
import { JavascriptReprinter } from "../../language-js/index.js";
import { ILanguage } from "../../language.js";
import { StringUtils } from "../../utilities/string-utils.js";
import { sortAttributes } from "../sortAttributes/index.js";

export class Reprinter implements ILanguage {
  public static readonly EXTENSIONS = [".html", ".html.txt"];
  // private options: BaseSortierOptions;

  public getRewrittenContents(filename: string, fileContents: string, options: BaseSortierOptions) {
    const ast = parse(fileContents, { canSelfClose: true });

    if (ast.errors.length > 0) {
      throw new Error(ast.errors[0].msg);
    }

    return this.sortNode(
      options,
      {
        children: ast.rootNodes,
      },
      fileContents,
    );
  }

  public isFileSupported(filename: string) {
    return StringUtils.stringEndsWithAny(filename, Reprinter.EXTENSIONS);
  }

  private sortNode(options: BaseSortierOptions, node: /* Document */ any, fileContents: string): string {
    fileContents = sortAttributes(node, fileContents);

    if (node.children != null) {
      for (const child of node.children) {
        fileContents = this.sortNode(options, child, fileContents);
      }
    }

    if (node.name === "style") {
      fileContents = this.sortStyleTagContents(options, node, fileContents);
    }
    if (node.name === "script") {
      fileContents = this.sortScriptTagContents(options, node, fileContents);
    }

    return fileContents;
  }

  private sortStyleTagContents(options: BaseSortierOptions, node: any, fileContents: string) {
    const isCssType = this.cantFindOrMatchesAttributeKeyValue(node, "type", ["text/css"]);
    if (!isCssType) {
      return fileContents;
    }
    for (let x = 0; x < node.children.length; x++) {
      const child = node.children[x];
      fileContents = this.sortSubstring(
        fileContents,
        child.sourceSpan.start.offset,
        child.sourceSpan.end.offset,
        (text: string) => new CssReprinter().getRewrittenContents("example.css", text, options),
      );
    }
    return fileContents;
  }

  private sortScriptTagContents(options: BaseSortierOptions, node: any, fileContents: string) {
    const isJavascriptType = this.cantFindOrMatchesAttributeKeyValue(node, "type", [
      "text/javascript",
      "application/javascript",
    ]);
    if (!isJavascriptType) {
      return fileContents;
    }
    for (let x = 0; x < node.children.length; x++) {
      const child = node.children[x];
      fileContents = this.sortSubstring(
        fileContents,
        child.sourceSpan.start.offset,
        child.sourceSpan.end.offset,
        (text: string) => new JavascriptReprinter().getRewrittenContents("example.js", text, options),
      );
    }
    return fileContents;
  }

  private cantFindOrMatchesAttributeKeyValue(node: any, key: string, value: Array<string>) {
    const typeAttrs = node.attrs.filter((attr: any) => {
      return attr.name === key;
    });
    if (typeAttrs.length !== 0) {
      return value.indexOf(typeAttrs[0].value) !== -1;
    } else {
      return true;
    }
  }

  private sortSubstring(fileContents: string, start: number, end: number, sortFunc: (text: string) => string) {
    const textBefore = fileContents.substring(0, start);
    const textToSort = fileContents.substring(start, end);
    const textAfter = fileContents.substring(end);
    const newContents = sortFunc(textToSort);
    return textBefore + newContents + textAfter;
  }
}
