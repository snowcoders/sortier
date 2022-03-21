import React from "react";
import cssDefaultText from "./default-text/css.txt";
import htmlDefaultText from "./default-text/html.txt";
import jsDefaultText from "./default-text/js.txt";
import jsxDefaultText from "./default-text/jsx.txt";
import tsDefaultText from "./default-text/ts.txt";
import tsxDefaultText from "./default-text/tsx.txt";
import { SortierWorkerInputData } from "./format-workers/types";
import { useSortier } from "./hooks/format-text";

const fileTypeToDefaultText = {
  css: cssDefaultText,
  html: htmlDefaultText,
  js: jsDefaultText,
  jsx: jsxDefaultText,
  ts: tsDefaultText,
  tsx: tsxDefaultText,
} as const;

export function App() {
  const urlSearchParams = new URLSearchParams(window.location.search);

  const defaultFileType = getUrlFileTypeOrDefault(urlSearchParams);
  const [sortierOutput, setSortierInput] = useSortier({
    options: {},
    text: fileTypeToDefaultText[defaultFileType],
    type: defaultFileType,
  });

  const onTextInputChange: React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  >["onChange"] = (e) => {
    const { value } = e.target;
    setSortierInput({
      ...sortierOutput,
      text: value,
    });
  };

  const onFileTypeChange: React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  >["onChange"] = (e) => {
    const value = e.target.value as SortierWorkerInputData["type"];
    setSortierInput({
      ...sortierOutput,
      text: fileTypeToDefaultText[value],
      type: value,
    });
  };

  const { outputText, text, type } = sortierOutput;

  return (
    <div className="site--playground">
      <div className="settings">
        <select defaultValue={type} name="filetype" onChange={onFileTypeChange}>
          {Object.keys(fileTypeToDefaultText).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <textarea name="text" onChange={onTextInputChange} value={text} />
      <textarea name="text" readOnly value={outputText} />
    </div>
  );
}

function getUrlFileTypeOrDefault(
  urlSearchParams: URLSearchParams
): SortierWorkerInputData["type"] {
  const possibleFileType = urlSearchParams.get("file_type");

  if (possibleFileType != null) {
    const keys = Object.keys(fileTypeToDefaultText);
    const result = keys.indexOf(possibleFileType);
    if (result !== -1) {
      return keys[result] as SortierWorkerInputData["type"];
    }
  }
  return "css";
}
