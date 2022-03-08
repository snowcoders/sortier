import React, { useEffect, useState } from "react";
import { SortierWorkerData } from "../format-workers/css";

export function useFormatCss(inputText: string) {
  const [outputText, setOutputText] = useState("Loading formatter");
  const [worker, setWorker] = useState<Worker | null>();

  useEffect(() => {
    const worker = new Worker(
      new URL("../format-workers/css", import.meta.url)
    );
    worker.onmessage = (e: MessageEvent<SortierWorkerData>) => {
      const { data } = e;
      setOutputText(data.text);
    };
    worker.postMessage({
      text: inputText,
    });
    setWorker(worker);
  }, []);

  const formatInputText = React.useCallback(
    (inputText: string) => {
      worker?.postMessage({
        text: inputText,
        options: {},
      });
    },
    [worker]
  );

  return [outputText, formatInputText] as const;
}
