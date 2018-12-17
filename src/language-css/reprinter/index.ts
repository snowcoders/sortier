import { parse as lessParse } from "postcss-less";
import { parse as scssParse } from "postcss-scss";
import { ILanguage } from "../../language";
import { ReprinterOptions } from "../../reprinter-options";
import { StringUtils } from "../../utilities/string-utils";

export type ReprinterOptions = Partial<ReprinterOptionsRequired>;

export interface ReprinterOptionsRequired {
  // Default undefined. The parser to use. If undefined, sortier will determine the parser to use based on the file extension
  parser?: "less" | "scss";

  // Default undefined. If defined, this will override the default sort and these properties will be ordered as found in the list.
  overrides: string[];
}

export class Reprinter implements ILanguage {
  public static readonly SCSS_EXTENSIONS = [
    ".css",
    ".css.txt",
    ".scss",
    ".scss.txt"
  ];
  public static readonly LESS_EXTENSIONS = [".less", ".less.txt"];

  private options: ReprinterOptionsRequired;

  public getRewrittenContents(
    filename: string,
    fileContents: string,
    options: ReprinterOptions
  ) {
    this.options = this.getValidatedOptions(options);

    let ast = this.getParser(filename)(fileContents, { canSelfClose: true });

    return this.sortNode(
      {
        children: ast.rootNodes
      },
      fileContents
    );
  }

  private getValidatedOptions(
    appOptions: ReprinterOptions
  ): ReprinterOptionsRequired {
    let partialOptions = appOptions.css;

    return {
      overrides: [],
      ...partialOptions
    };
  }

  private getParser(filename: string) {
    // If the options overide the parser type
    if (this.options.parser === "less") {
      return lessParse;
    }
    if (this.options.parser === "scss") {
      return scssParse;
    }

    // If the user didn't override the parser type, try to infer it
    let isTypescript = StringUtils.stringEndsWithAny(
      filename,
      Reprinter.LESS_EXTENSIONS
    );
    if (isTypescript) {
      return lessParse;
    }

    let isJavascript = StringUtils.stringEndsWithAny(
      filename,
      Reprinter.SCSS_EXTENSIONS
    );
    if (isJavascript) {
      return scssParse;
    }

    throw new Error("File not supported");
  }

  public isFileSupported(filename: string) {
    return StringUtils.stringEndsWithAny(filename, [
      ...Reprinter.SCSS_EXTENSIONS,
      ...Reprinter.LESS_EXTENSIONS
    ]);
  }

  private sortNode(node: /* Document */ any, fileContents: string): string {
    //fileContents = sortAttributes(node, fileContents);

    if (node.children != null) {
      for (let child of node.children) {
        fileContents = this.sortNode(child, fileContents);
      }
    }
    return fileContents;
  }
}
