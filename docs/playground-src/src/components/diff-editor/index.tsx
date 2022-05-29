import React from "react";
import { SortierWorkerInputData } from "../../hooks/use-sortier";
import { CodeEditor } from "./code-editor";
import "./styles.css";

export type DiffEditorProps = {
  fileType: SortierWorkerInputData["type"];
  inputText: string;
  outputText: string;
  onInputTextChange: (newText: string) => void;
};

export function DiffEditor(props: DiffEditorProps) {
  const { inputText, onInputTextChange, outputText, fileType } = props;

  const onTextChange = React.useCallback(
    (e: string) => {
      onInputTextChange(e);
    },
    [onInputTextChange]
  );

  return (
    <div className="site--diff-editor">
      <CodeEditor
        fileType={fileType}
        className="input"
        onChange={onTextChange}
        value={inputText}
      />
      <CodeEditor fileType={fileType} className="output" value={outputText} />
    </div>
  );
}
