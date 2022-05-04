import { browserHistory } from "../utilities/history";

const queryParamKeys = ["code", "fileType", "options"] as const;
export type QueryParamKey = typeof queryParamKeys[number];
export type GetQueryParamValueOptions<T> = {
  allowedValues?: Array<T>;
};

const transposeString = {
  serialize: (paramValue: string) => {
    return encodeURIComponent(paramValue);
  },
  deserialize: (paramValue: string) => {
    return decodeURIComponent(paramValue);
  },
} as const;
const transposeBase64 = {
  serialize: (paramValue: string) => {
    return encodeURIComponent(btoa(paramValue));
  },
  deserialize: (paramValue: string) => {
    return atob(decodeURIComponent(paramValue));
  },
} as const;

const keyToTransposer: Record<QueryParamKey, typeof transposeBase64> = {
  code: transposeBase64,
  options: transposeBase64,
  fileType: transposeString,
} as const;

export function getQueryParamValue<T extends string | null>(
  key: QueryParamKey,
  options?: GetQueryParamValueOptions<T>
): T | null {
  const params = new URLSearchParams(window.location.search);
  const value = params.get(key);
  const typedValue = value as T;
  if (typedValue == null) {
    return typedValue;
  }

  if (options) {
    const { allowedValues } = options;
    if (allowedValues != null) {
      if (allowedValues.includes(typedValue)) {
        return typedValue;
      } else {
        return null;
      }
    }
  }

  return keyToTransposer[key].deserialize(typedValue) as T;
}

export function setQueryParamValue(key: QueryParamKey, value: string | null) {
  setQueryParamValues({
    [key]: value,
  });
}

export function setQueryParamValues(
  records: Partial<Record<QueryParamKey, string | null>>
) {
  const { search, origin, pathname } = window.location;
  const params = new URLSearchParams(search);

  for (const key in records) {
    const typedKey = key as QueryParamKey;
    const value = records[typedKey];
    if (value == null) {
      params.delete(key);
    } else {
      const savableValue = keyToTransposer[typedKey].serialize(value);
      params.set(key, savableValue);
    }
  }

  const newUrl = `${origin}${pathname}?${params.toString()}`;
  browserHistory.replace(newUrl);
}
