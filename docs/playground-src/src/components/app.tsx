import React, { useEffect } from "react";
import { useQueryState, setQueryParamValues } from "../hooks/use-query-state";
import { useSortier } from "../hooks/use-sortier";
import { useSortierOptions } from "../hooks/use-sortier-options";
import { fileTypes, getDefaultText } from "../utilities/default-text";
import { DiffEditor, DiffEditorProps } from "./diff-editor";
import { OptionsEditor, OptionsEditorProps } from "./options-editor";
import "./styles.css";

export function App() {
  //#region State variables
  const [fileType] = useQueryState("fileType", fileTypes[0], {
    allowedValues: fileTypes,
  });
  const [inputText] = useQueryState("code", getDefaultText(fileType));
  const [options, setOptions] = useSortierOptions();
  //#region State variables

  //#region Effects
  const [sortierOutput, setSortierInput] = useSortier({
    options: options,
    text: inputText,
    type: fileType,
  });

  useEffect(() => {
    setSortierInput({
      options: options,
      text: inputText,
      type: fileType,
    });
  }, [inputText, options, fileType]);
  //#endregion Effects

  //#region Callbacks
  const onTextInputChange: DiffEditorProps["onInputTextChange"] = (value) => {
    setQueryParamValues({
      code: value,
    });
  };

  const onFileTypeChange: OptionsEditorProps["onFileTypeChange"] = (
    newFileType
  ) => {
    setQueryParamValues({
      code: getDefaultText(newFileType),
      fileType: newFileType,
    });
  };
  //#endregion Callbacks

  const { outputText, type } = sortierOutput;

  return (
    <div className="site--playground">
      <OptionsEditor
        className="options"
        fileType={type}
        onFileTypeChange={onFileTypeChange}
        onOptionsChange={setOptions}
        options={options}
      />
      <DiffEditor
        fileType={type}
        inputText={inputText}
        onInputTextChange={onTextInputChange}
        outputText={outputText}
      />
    </div>
  );
}
