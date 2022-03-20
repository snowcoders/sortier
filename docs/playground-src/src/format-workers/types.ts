import { SortierOptions } from "../../../../src/config";

export type SortierWorkerInputData = {
  type: "css" | "html" | "js" | "jsx" | "ts" | "tsx";
  text: string;
  options: SortierOptions;
};
export type SortierWorkerOutputData = {
  text: string;
};
