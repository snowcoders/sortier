import fs from "fs";
import { globbySync } from "globby";
import { Context } from "./args-parser.js";

export function getFiles(context: Context): Array<string> {
  const { filepatterns } = context;

  // Files that match the actual paths
  const fullPathFiles = filepatterns.filter((filepattern) => fs.existsSync(filepattern));
  const globMatchFiles = globbySync(context.filepatterns, {
    dot: true,
  });

  const set = new Set<string>();
  fullPathFiles.forEach((value) => set.add(value));
  globMatchFiles.forEach((value) => set.add(value));

  return Array.from(set).sort();
}
