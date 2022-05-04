import React from "react";
import { fileTypes } from "../../utilities/default-text";
import { SortierWorkerInputData } from "../../hooks/use-sortier";
import "./styles.css";

export type OptionsEditorProps = {
  className?: string;
  fileType: SortierWorkerInputData["type"];
  options: SortierWorkerInputData["options"];
  onFileTypeChange: (fileType: SortierWorkerInputData["type"]) => void;
  onOptionsChange: (fileType: SortierWorkerInputData["options"]) => void;
};

// TODO: Need to use informed + schema to create the form to edit options

export function OptionsEditor(props: OptionsEditorProps) {
  const { className, fileType, onFileTypeChange } = props;

  const onSelectChange: React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  >["onChange"] = (e) => {
    const { value } = e.currentTarget;
    const validFileType = fileTypes.find((fileType) => fileType === value);

    if (validFileType == null) {
      return;
    }

    onFileTypeChange(validFileType);
  };

  //#region callbacks
  const onSubmit: React.DOMAttributes<HTMLFormElement>["onSubmit"] = (e) => {
    e.preventDefault();
  };
  //#endregion

  return (
    <section className={"site--options-editor " + className}>
      <form onSubmit={onSubmit}>
        <legend>File info</legend>
        <label htmlFor="filetype">File type</label>
        <select
          defaultValue={fileType}
          name="filetype"
          onChange={onSelectChange}
        >
          {fileTypes.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </form>
      <form>
        <legend>Options</legend>
      </form>
    </section>
  );
}
