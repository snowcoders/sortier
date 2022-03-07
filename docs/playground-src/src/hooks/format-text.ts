import React, { useEffect, useState } from "react";
import { SortierWorkerData } from "../worker";

export function useFormatText(inputText: string) {
  const [outputText, setOutputText] = useState(inputText);
  const [worker, setWorker] = useState<Worker | null>();

  useEffect(() => {
    const worker = new Worker(new URL("../worker", import.meta.url));
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
      });
    },
    [worker]
  );

  return [outputText, formatInputText] as const;
}
