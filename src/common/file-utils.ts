import * as fs from "fs";

export function readFileContents(filename: string) {
  try {
    return fs.readFileSync(filename, "utf8");
  } catch (error) {
    throw new Error(`Could not read file: ${filename}\n${error.message}`);
  }
}

export function writeFileContents(filename: string, fileContents: string) {
  try {
    fs.writeFileSync(filename, fileContents, "utf8");
  } catch (error) {
    throw new Error(`Could not write file: ${filename}\n${error.message}`);
  }
}
