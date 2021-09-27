import * as fs from "fs";
import { join } from "path";

export class FileUtils {
  public static globbyJoin(...paths: string[]) {
    const path = join(...paths);
    return path.split("\\").join("/");
  }

  public static readFileContents(filename: string) {
    try {
      return fs.readFileSync(filename, "utf8");
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Could not read file: ${filename}\n${error.message}`);
      } else {
        throw new Error(`Could not read file: ${filename}`);
      }
    }
  }

  public static writeFileContents(filename: string, fileContents: string) {
    try {
      fs.writeFileSync(filename, fileContents, "utf8");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Could not read file: ${filename}\n${error.message}`);
      } else {
        throw new Error(`Could not read file: ${filename}`);
      }
    }
  }
}
