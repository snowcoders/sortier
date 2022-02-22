import React from "react";
import ReactDom from "react-dom";

import { App } from "./app";
const mountingDiv = document.body.getElementsByClassName(
  "site--mount"
)[0] as HTMLDivElement;
if (mountingDiv == null) {
  throw new Error("Could not find site--mount");
}

ReactDom.render(<App />, mountingDiv);
