import { Main } from "./main";

export function run(args: string[]) {
  // Get the arguments with defaults
  new Main().run(args);
}
