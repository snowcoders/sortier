import React from "react";
import { useFormatCss } from "./hooks/format-text";

export function App() {
  const [text, setText] = useFormatCss("");

  const onChange: React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  >["onChange"] = (e) => {
    setText(e.target.value);
  };

  return (
    <div className="site--playground">
      <textarea onChange={onChange} name="text" />
      <textarea name="text" readOnly value={text} />
    </div>
  );
}
