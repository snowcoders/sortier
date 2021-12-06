import { parse as lessParse } from "postcss-less";
import { parse as scssParse } from "postcss-scss";
import { ILanguage } from "../../language.js";
import { SortierOptions as BaseSortierOptions } from "../../config/index.js";
import { StringUtils } from "../../utilities/string-utils.js";
import {
  SortDeclarationsOptions,
  sortDeclarations,
} from "../sortDeclarations/index.js";

export type SortierOptions = Partial<CssSortierOptionsRequired>;

export interface CssSortierOptionsRequired {
  // Default undefined. The parser to use. If undefined, sortier will determine the parser to use based on the file extension
  parser?: "less" | "scss";

  // Default undefined. If defined, this will override the default sort and these properties will be ordered as found in the list.
  sortDeclarations: SortDeclarationsOptions;
}

export class Reprinter implements ILanguage {
  public static readonly LESS_EXTENSIONS = [".less", ".less.txt"];
  public static readonly SCSS_EXTENSIONS = [
    ".css",
    ".css.txt",
    ".scss",
    ".scss.txt",
  ];

  public getRewrittenContents(
    filename: string,
    fileContents: string,
    options: BaseSortierOptions
  ) {
    const validatedOptions = this.getValidatedOptions(options);

    const parser = this.getParser(validatedOptions, filename);
    const ast = parser(fileContents, {
      // sourcesContent: true,
    });

    return this.sortNode(validatedOptions, ast, fileContents);
  }

  public isFileSupported(filename: string) {
    return StringUtils.stringEndsWithAny(filename, [
      ...Reprinter.SCSS_EXTENSIONS,
      ...Reprinter.LESS_EXTENSIONS,
    ]);
  }

  private getValidatedOptions(
    appOptions: BaseSortierOptions
  ): CssSortierOptionsRequired {
    const partialOptions = appOptions.css;

    return {
      sortDeclarations: {
        overrides: [],
      },
      ...partialOptions,
    };
  }

  private getParser(options: CssSortierOptionsRequired, filename: string) {
    // If the options overide the parser type
    if (options.parser === "less") {
      return lessParse;
    }
    if (options.parser === "scss") {
      return scssParse;
    }

    // If the user didn't override the parser type, try to infer it
    const isLess = StringUtils.stringEndsWithAny(
      filename,
      Reprinter.LESS_EXTENSIONS
    );
    if (isLess) {
      return lessParse;
    }

    const isScss = StringUtils.stringEndsWithAny(
      filename,
      Reprinter.SCSS_EXTENSIONS
    );
    if (isScss) {
      return scssParse;
    }

    throw new Error("File not supported");
  }

  private sortNode(
    options: CssSortierOptionsRequired,
    node: /* Document */ any,
    fileContents: string
  ): string {
    const rules: any[] = [];

    for (const child of node.nodes) {
      switch (child.type) {
        case "rule":
          rules.push(child);
          break;
      }
    }

    for (const rule of rules) {
      fileContents = this.sortNode(options, rule, fileContents);
    }

    fileContents = sortDeclarations(
      node,
      fileContents,
      options.sortDeclarations
    );

    return fileContents;
  }
}
