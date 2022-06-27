import Ajv, { JSONSchemaType } from "ajv";
import {
  CssSortierOptions,
  cssSortierOptionsSchema,
} from "../language-css/index.js";
import {
  JavascriptSortierOptions,
  javascriptSortierOptionsSchema,
} from "../language-js/index.js";

export interface SortierOptions {
  /**
   * If true, sortier will run but not rewrite any files. Great for testing to make sure your code base doesn't have any weird issues before rewriting code.
   * @default false
   */
  isTestRun: boolean;

  /**
   * Amount of detail to be shown on the console
   *   - "quiet" - No console logs
   *   - "normal" - General information (e.g. if sortier was unable to parse a file)
   *   - "diagnostic" - All the above along with type information that sortier was unable to handle (great for opening bugs!)
   * @default "normal"
   */
  logLevel: "diagnostic" | "normal" | "quiet";

  // Options for the javascript type languages
  css: CssSortierOptions;

  // Options for the javascript type languages
  js: JavascriptSortierOptions;
}

export const sortierOptionsSchema: JSONSchemaType<SortierOptions> = {
  type: "object",
  properties: {
    isTestRun: {
      type: "boolean",
      default: false,
    },
    logLevel: {
      type: "string",
      enum: ["diagnostic", "normal", "quiet"],
      default: "normal",
    },
    css: {
      ...cssSortierOptionsSchema,
      // Filled in by ajv
      default: {} as any,
    },
    js: {
      ...javascriptSortierOptionsSchema,
      // Filled in by ajv
      default: {} as any,
    },
  },
  required: [],
};

const ajv = new Ajv({
  useDefaults: true,
  allErrors: true,
});
const optionsValidator = ajv.compile(sortierOptionsSchema);

export function validateOptions(options: unknown) {
  if (typeof options !== "object") {
    throw new Error("Expected options to be an object");
  }
  const clone = { ...options };
  const isValid = optionsValidator(clone);
  if (!isValid) {
    const errorText = ajv.errorsText(optionsValidator.errors, {
      dataVar: "options",
    });
    throw new Error(errorText);
  }
  return clone;
}
