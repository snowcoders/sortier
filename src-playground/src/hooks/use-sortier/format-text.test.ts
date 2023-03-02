import { expect, it } from "@jest/globals";
import { renderHook } from "@testing-library/react-hooks";
import { useSortier } from "./format-text.js";

it("Renders", () => {
  const sortierOutput = renderHook(() =>
    useSortier({
      options: {},
      text: "const d = 1234",
      type: "js",
    })
  );

  expect(sortierOutput.result.current[0].outputText).toBe("const d = 1234;");
});
