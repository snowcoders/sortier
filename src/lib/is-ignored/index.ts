import ignore from "ignore";

export function isIgnored(ignoreFileContents: string, relativeFilePath: string): boolean {
  if (ignoreFileContents.length === 0) {
    return false;
  }
  // @ts-expect-error: ignore seems to be badly typed
  //  - https://arethetypeswrong.github.io/?p=ignore%405.2.4
  //  - https://github.com/kaelzhang/node-ignore/issues/96
  const ig = ignore();
  ig.add(ignoreFileContents.split(/\r?\n/));
  return ig.ignores(relativeFilePath);
}
