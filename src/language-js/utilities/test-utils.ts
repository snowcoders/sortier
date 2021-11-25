import { basename } from "path";

// Parsers
import { parse as flowParse } from "../parsers/flow/index.js";
import { parse as typescriptParse } from "../parsers/typescript/index.js";

export function getParser(inputFilePath: string) {
  const fileName = basename(inputFilePath);
  const fileType = fileName.substring(0, fileName.indexOf("."));
  let parser;
  switch (fileType) {
    case "flow":
      parser = flowParse;
      break;
    case "es6":
    case "typescript":
      parser = typescriptParse;
      break;
    default:
      throw new Error(
        "Unknown parser passed - " +
          fileType +
          ". Expected 'flow', 'typescript' or 'es6'."
      );
  }
  return parser;
}
