import { useMemo } from "react";
import { SortierWorkerInputData } from "./use-sortier";
import { useQueryState } from "./use-query-state";

export function useSortierOptions() {
  const [options, setOptions] = useQueryState<string>("options", "{}");

  const result: SortierWorkerInputData["options"] = useMemo(() => {
    return JSON.parse(options);
  }, [options]);

  return [
    result,
    (newValue: SortierWorkerInputData["options"]) => {
      setOptions(JSON.stringify(newValue));
    },
  ] as const;
}
