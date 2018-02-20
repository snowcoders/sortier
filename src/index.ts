import { Reprinter, ReprinterOptions } from "./reprinter";

export function format(filePath: string, options: ReprinterOptions) {
  Reprinter.rewrite(filePath, options);
}