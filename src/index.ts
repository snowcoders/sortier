import { Reprinter } from "./reprinter";
import { ReprinterOptions } from "./reprinter-options";

export function format(filePath: string, options: ReprinterOptions) {
  Reprinter.rewrite(filePath, options);
}
