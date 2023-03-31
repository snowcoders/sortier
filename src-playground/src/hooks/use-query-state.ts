import { useCallback, useEffect, useState } from "react";
import { browserHistory } from "../utilities/history";
import {
  GetQueryParamValueOptions,
  QueryParamKey,
  getQueryParamValue,
  setQueryParamValues,
} from "../utilities/query-state";

export { setQueryParamValues };

export function useQueryState<T extends null | string>(
  key: QueryParamKey,
  defaultValue: (() => T) | T,
  options?: GetQueryParamValueOptions<T>
) {
  const [internalValue, setInternalValue] = useState(getQueryParamValue(key, options) ?? defaultValue);

  const setValue = (value: T) => {
    setQueryParamValues({ [key]: value });
  };

  const popStateHandler = useCallback(() => {
    const possibleNewValue = getQueryParamValue(key, options);
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
