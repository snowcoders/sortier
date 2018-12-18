import { parse as lessParse } from "postcss-less";
import { parse as scssParse } from "postcss-scss";
import { ILanguage } from "../../language";
import { ReprinterOptions } from "../../reprinter-options";
import { StringUtils } from "../../utilities/string-utils";
import { sortDeclarations, SortDeclarationsOptions } from "../sortDeclarations";

export type ReprinterOptions = Partial<ReprinterOptionsRequired>;

export interface ReprinterOptionsRequired {
  // Default undefined. The parser to use. If undefined, sortier will determine the parser to use based on the file extension
  parser?: "less" | "scss";

  // Default undefined. If defined, this will override the default sort and these properties will be ordered as found in the list.
  sortDeclarations: SortDeclarationsOptions;
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

    let parser = this.getParser(filename);
    let ast = parser(fileContents, {
      sourcesContent: true
    });

    return this.sortNode(ast, fileContents);
  }

  private getValidatedOptions(
    appOptions: ReprinterOptions
  ): ReprinterOptionsRequired {
    let partialOptions = appOptions.css;

    return {
      sortDeclarations: {
        overrides: []
      },
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
    let isLess = StringUtils.stringEndsWithAny(
      filename,
      Reprinter.LESS_EXTENSIONS
    );
    if (isLess) {
      return lessParse;
    }

    let isScss = StringUtils.stringEndsWithAny(
      filename,
      Reprinter.SCSS_EXTENSIONS
    );
    if (isScss) {
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
    let rules: any[] = [];

    for (let child of node.nodes) {
      switch (child.type) {
        case "rule":
          rules.push(child);
          break;
      }
    }

    for (let rule of rules) {
      fileContents = this.sortNode(rule, fileContents);
    }

    fileContents = sortDeclarations(
      node,
      fileContents,
      this.options.sortDeclarations
    );

    return fileContents;
  }
}
