import * as parse from "json-to-ast";
import { ILanguage } from "../../language";
import { ReprinterOptions } from "../../reprinter-options";
import { StringUtils } from "../../utilities/string-utils";

export class Reprinter implements ILanguage {
  public static readonly EXTENSIONS = [".json", ".json.txt"];

  public isFileSupported(filename: string) {
    return StringUtils.stringEndsWithAny(filename, Reprinter.EXTENSIONS);
  }

  public getRewrittenContents(
    filename: string,
    fileContents: string,
    options: ReprinterOptions
  ) {
    let ast = parse(fileContents);

    return this.sortAst(ast, fileContents);
  }

  private sortAst(node: /* Document */ any, fileContents: string): string {
    if (node.children != null) {
      for (let child of node.children) {
        fileContents = this.sortAst(child, fileContents);
      }
    }
    return fileContents;
  }
}
