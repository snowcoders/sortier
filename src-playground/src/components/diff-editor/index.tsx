import React, { ChangeEvent } from "react";
import { SortierWorkerInputData } from "../../hooks/use-sortier";
import "./styles.css";

export type DiffEditorProps = {
  fileType: SortierWorkerInputData["type"];
  inputText: string;
  outputText: string;
  onInputTextChange: (newText: string) => void;
};

export function DiffEditor(props: DiffEditorProps) {
  const { inputText, onInputTextChange, outputText } = props;

  const onTextChange = React.useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onInputTextChange(e.currentTarget.value);
    },
    [onInputTextChange]
  );

  return (
    <div className="site--diff-editor">
      <textarea
        className="input"
        name="text"
        onChange={onTextChange}
        value={inputText}
      />
      <textarea className="output" name="text" readOnly value={outputText} />
    </div>
  );
}
