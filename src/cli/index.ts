import { printArray } from "../lib";

export function run(args: string[]) {
  if (args == null || args.length === 0) {
    console.error("No arguments provided");
    return -1;
  }

  console.log("The arguments provided are below:");
  printArray(args);
  return 0;
}
