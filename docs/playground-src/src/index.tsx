import React from "react";
import ReactDom from "react-dom/client";

import { App } from "./components/app";
const mountingDiv = document.body.getElementsByClassName(
  "site--mount"
)[0] as HTMLDivElement;
if (mountingDiv == null) {
  throw new Error("Could not find site--mount");
}

const root = ReactDom.createRoot(mountingDiv, {});
root.render(<App />);
