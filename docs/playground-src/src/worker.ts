export type SortierWorkerData = { text: string; options: {} };

onmessage = function (e) {
  const { data } = e;
  if (data == null) {
    return;
  }
  const { text } = data;
  postMessage({ text: `Formatted text: ${text}` });
};
