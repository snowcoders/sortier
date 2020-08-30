import { basename } from "path";

// Parsers
import { parse as flowParse } from "../parsers/flow";
import { parse as typescriptParse } from "../parsers/typescript";

export function getParser(inputFilePath: string) {
  const fileName = basename(inputFilePath);
  const fileType = fileName.substring(0, fileName.indexOf("."));
  let parser;
  switch (fileType) {
    case "es6":
    case "flow":
      parser = flowParse;
      break;
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
