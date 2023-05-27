import * as monaco from "monaco-editor";
import React from "react";
import { SortierWorkerInputData } from "../../../hooks/use-sortier";
import "./styles.css";

export type CodeEditorProps = {
  className?: string;
  fileType: SortierWorkerInputData["type"];
  value: string;
  onChange?: (newValue: string) => void;
};

function fileTypeToJsx(fileType: SortierWorkerInputData["type"]): boolean {
  switch (fileType) {
    case "jsx":
    case "tsx":
      return true;
    default:
      return false;
  }
}

function fileTypeToLanguage(fileType: SortierWorkerInputData["type"]): string {
  switch (fileType) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    default:
      return fileType;
  }
}

export function CodeEditor(props: CodeEditorProps) {
  const { className, fileType, onChange, value } = props;

  const ref = React.useRef<HTMLDivElement>(null);

  // Calculated values
  const readOnly = onChange == null;
  const isJsx = fileTypeToJsx(fileType);
  const language = fileTypeToLanguage(fileType);
  const monacoInstance = React.useMemo(() => {
    const { current } = ref;
    if (current == null) {
      return null;
    }
    const instance = monaco.editor.create(current, {
      automaticLayout: true,
      language: language,
      readOnly: readOnly,
      value: value,
    });

    return instance;
  }, [ref.current]);

  // Effects from if props change
  React.useEffect(() => {
    if (monacoInstance == null) {
      return;
    }
    const newModel = monaco.editor.createModel(value, language);
    monacoInstance.setModel(newModel);

    if (isJsx) {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.React,
      });
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.React,
      });
    } else {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.None,
      });
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.None,
      });
    }
  }, [monacoInstance, language, isJsx]);

  React.useEffect(() => {
    if (monacoInstance == null) {
      return;
    }

    const model = monacoInstance.getModel();
    if (model == null) {
      return;
    }

    if (model.getValue() !== value) {
      model.setValue(value);
    }
  }),
    [monacoInstance, value];

  React.useEffect(() => {
    if (monacoInstance == null) {
      return;
    }
    if (onChange == null) {
      return;
    }

    const listener = monacoInstance.onDidChangeModelContent(() => {
      onChange(monacoInstance.getValue());
    });

    return () => {
      listener.dispose();
    };
  }),
    [monacoInstance, onChange];

  // Render
  return (
    <div className="site--diff-editor--code-editor">
      <div className={className} ref={ref}></div>
    </div>
  );
}
