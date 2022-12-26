import { SortierOptions } from "../../../../src/config";

export type SortierWorkerInputData = {
  options: SortierOptions;
  text: string;
  type: "css" | "html" | "js" | "jsx" | "ts" | "tsx";
};
export type SortierWorkerOutputData = {
  text: string;
};
