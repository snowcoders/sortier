import ignore from "ignore";

export function isIgnored(ignoreFileContents: string, relativeFilePath: string): boolean {
  if (ignoreFileContents.length === 0) {
    return false;
  }
  const ig = ignore();
  ig.add(ignoreFileContents.split(/\r?\n/));
  return ig.ignores(relativeFilePath);
}
