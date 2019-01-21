import { parse } from "angular-html-parser";
import { ILanguage } from "../../language";
import { CssReprinter } from "../../language-css";
import { ReprinterOptions } from "../../reprinter-options";
import { StringUtils } from "../../utilities/string-utils";
import { sortAttributes } from "../sortAttributes";

export class Reprinter implements ILanguage {
  public static readonly EXTENSIONS = [".html", ".html.txt"];
  private options: ReprinterOptions;

  public getRewrittenContents(
    filename: string,
    fileContents: string,
    options: ReprinterOptions
  ) {
    this.options = options;
    let ast = parse(fileContents, { canSelfClose: true });

    return this.sortNode(
      {
        children: ast.rootNodes
      },
      fileContents
    );
  }

  public isFileSupported(filename: string) {
    return StringUtils.stringEndsWithAny(filename, Reprinter.EXTENSIONS);
  }

  private sortNode(node: /* Document */ any, fileContents: string): string {
    fileContents = sortAttributes(node, fileContents);

    if (node.children != null) {
      for (let child of node.children) {
        fileContents = this.sortNode(child, fileContents);
      }
    }

    if (node.name === "style") {
      for (let x = 0; x < node.children.length; x++) {
        let child = node.children[x];
        let textBefore = fileContents.substring(
          0,
          child.sourceSpan.start.offset
        );
        let textAfter = fileContents.substring(child.sourceSpan.end.offset);
        let newContents = new CssReprinter().getRewrittenContents(
          "example.css",
          child.value,
          this.options
        );
        fileContents = textBefore + newContents + textAfter;
      }
    }

    return fileContents;
  }
}
