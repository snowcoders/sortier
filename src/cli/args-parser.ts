export type Context = {
  filepatterns: string[];
  ignoreUnknown: boolean;
};

export function parseArgs(args: string[]): Context {
  return {
    filepatterns: args.filter((value) => !value.startsWith("--")),
    ignoreUnknown: args.includes("--ignore-unknown"),
  };
}
