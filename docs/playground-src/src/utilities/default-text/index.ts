import { SortierWorkerInputData } from "../../hooks/use-sortier";
import cssDefaultText from "./css.txt";
import htmlDefaultText from "./html.txt";
import jsDefaultText from "./js.txt";
import jsxDefaultText from "./jsx.txt";
import tsDefaultText from "./ts.txt";
import tsxDefaultText from "./tsx.txt";

const fileTypeToDefaultText: Record<SortierWorkerInputData["type"], string> = {
  css: cssDefaultText,
  html: htmlDefaultText,
  js: jsDefaultText,
  jsx: jsxDefaultText,
  ts: tsDefaultText,
  tsx: tsxDefaultText,
} as const;

export const fileTypes = Object.keys(fileTypeToDefaultText) as Array<
  keyof typeof fileTypeToDefaultText
>;

export function getDefaultText(fileType: keyof typeof fileTypeToDefaultText) {
  return fileTypeToDefaultText[fileType];
}
