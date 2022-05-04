import { useCallback, useEffect, useState } from "react";
import {
  getQueryParamValue,
  GetQueryParamValueOptions,
  QueryParamKey,
  setQueryParamValues,
} from "../utilities/query-state";
import { browserHistory } from "../utilities/history";

export { setQueryParamValues };

export function useQueryState<T extends string | null>(
  key: QueryParamKey,
  defaultValue: T,
  options?: GetQueryParamValueOptions<T>
) {
  const [internalValue, setInternalValue] = useState(
    getQueryParamValue(key, options) || defaultValue
  );

  const setValue = (value: T) => {
    setQueryParamValues({ [key]: value });
  };

  const popStateHandler = useCallback(() => {
    const possibleNewValue = getQueryParamValue(key, options);
    // TODO: If getQueryParamValue creates an object then this comparison will always be false and inefficient
    if (possibleNewValue === internalValue) {
      return;
    }
    setInternalValue(possibleNewValue ?? defaultValue);
  }, []);

  useEffect(() => {
    const unlisten = browserHistory.listen(popStateHandler);

    return () => {
      unlisten();
    };
  }, []);

  return [internalValue, setValue] as const;
}
