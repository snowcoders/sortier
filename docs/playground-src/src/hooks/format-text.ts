import React, { useEffect, useState } from "react";
import {
  SortierWorkerInputData,
  SortierWorkerOutputData,
} from "../format-workers/types";

function getWorker(fileType: SortierWorkerInputData["type"]) {
  switch (fileType) {
    case "js":
    case "jsx":
    case "tsx":
    case "ts":
      return new Worker(
        new URL("../format-workers/javascript", import.meta.url)
      );
    case "css":
      return new Worker(new URL("../format-workers/css", import.meta.url));
    case "html":
      return new Worker(new URL("../format-workers/html", import.meta.url));
    default:
      throw new Error(`File type ${fileType} not supported`);
  }
}

const loadingFormatterMessage = "Loading formatter";

export function useSortier(initialInput: SortierWorkerInputData) {
  const [outputText, setOutputText] = useState(loadingFormatterMessage);
  const [worker, setWorker] = useState<Worker | null>();
  const [input, setInput] = useState<SortierWorkerInputData>(initialInput);
  const [type, setType] = useState<SortierWorkerInputData["type"]>(
    initialInput.type
  );

  useEffect(() => {
    worker?.terminate();

    const newWorker = getWorker(input.type);
    newWorker.onmessage = (e: MessageEvent<SortierWorkerOutputData>) => {
      const { data } = e;
      setOutputText(data.text);
    };
    newWorker.postMessage(input);
    setWorker(newWorker);
  }, [type]);

  const formatInputText = React.useCallback(
    (newInput: SortierWorkerInputData) => {
      setInput(newInput);
      if (newInput.type !== input.type) {
        setOutputText(loadingFormatterMessage);
        setType(newInput.type);
      } else {
        worker?.postMessage(newInput);
      }
    },
    [worker]
  );

  return [{ ...input, outputText }, formatInputText] as const;
}
