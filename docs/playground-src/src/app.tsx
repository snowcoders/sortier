import React from "react";
import { useFormatText } from "./hooks/format-text";

export function App() {
  const [text, setText] = useFormatText("");

  const onChange: React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  >["onChange"] = (e) => {
    setText(e.target.value);
  };

  return (
    <div>
      <textarea onChange={onChange} name="text" />
      <div>{text}</div>
    </div>
  );
}
