import { parse } from "angular-html-parser";
import { ILanguage } from "../../language";
import { ReprinterOptions } from "../../reprinter-options";
import { StringUtils } from "../../utilities/string-utils";
import { sortAttributes } from "../sortAttributes";

export class Reprinter implements ILanguage {
  public static readonly EXTENSIONS = [".html", ".html.txt"];

  public isFileSupported(filename: string) {
    return StringUtils.stringEndsWithAny(filename, Reprinter.EXTENSIONS);
  }

  public getRewrittenContents(
    filename: string,
    fileContents: string,
    options: ReprinterOptions
  ) {
    let ast = parse(fileContents, { canSelfClose: true });

    return this.sortNode(
      {
        children: ast.rootNodes
      },
      fileContents
    );
  }

  private sortNode(node: /* Document */ any, fileContents: string): string {
    fileContents = sortAttributes(node, fileContents);

    if (node.children != null) {
      for (let child of node.children) {
        fileContents = this.sortNode(child, fileContents);
      }
    }
    return fileContents;
  }
}
