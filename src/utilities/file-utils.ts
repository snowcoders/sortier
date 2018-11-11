import * as fs from "fs";

export class FileUtils {
  public static readFileContents(filename: string) {
    try {
      return fs.readFileSync(filename, "utf8");
    } catch (error) {
      throw new Error(`Could not read file: ${filename}\n${error.message}`);
    }
  }

  public static writeFileContents(filename: string, fileContents: string) {
    try {
      fs.writeFileSync(filename, fileContents, "utf8");
    } catch (error) {
      throw new Error(`Could not write file: ${filename}\n${error.message}`);
    }
  }
}
