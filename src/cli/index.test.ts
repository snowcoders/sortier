// Imports - non-mocked dependencies
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { IgnoredFileError } from "../error/ignored-file-error.js";
import { UnsupportedExtensionError } from "../error/unsupported-extension-error.js";

// Imports - Mocked imports
jest.unstable_mockModule("../lib/format-file/index.js", () => ({
  formatFile: jest.fn(),
}));
enum MockLoggerVerboseOption {
  Quiet = 0,
  Normal = 1,
  Diagnostic = 2,
}
jest.unstable_mockModule("../utilities/log-utils.js", () => {
  return {
    LogUtils: {
      log: jest.fn(),
      setVerbosity: jest.fn(),
    },
    LoggerVerboseOption: MockLoggerVerboseOption,
  };
});
const reprinter = jest.mocked(await import("../lib/format-file/index.js"));
const logUtils = jest.mocked(await import("../utilities/log-utils.js"));

// Imports - File to run tests on
const { run } = await import("./index.js");

function verifyLogMessages(expectedMessages: Parameters<typeof logUtils.LogUtils.log>[]) {
  for (let messageIndex = 0; messageIndex < expectedMessages.length; messageIndex++) {
    const expectedMessage = expectedMessages[messageIndex];
    expect(logUtils.LogUtils.log).toHaveBeenNthCalledWith(messageIndex + 1, ...expectedMessage);
  }
  expect(logUtils.LogUtils.log).toHaveBeenCalledTimes(expectedMessages.length);
}

// TODO: #1320 - Jest does't support mocking of ESM imports
describe("cli", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("Prints message when 0 arguments given", () => {
    run([]);

    verifyLogMessages([[logUtils.LoggerVerboseOption.Normal, expect.stringContaining("Must provide a file pattern")]]);
  });

  it("Prints success message on found files", () => {
    run(["./package.json"]);

    expect(reprinter.formatFile).toHaveBeenLastCalledWith("./package.json");
    verifyLogMessages([
      [logUtils.LoggerVerboseOption.Normal, expect.stringMatching(/\.\/package\.json - ([0-9]*)ms$/)],
    ]);
  });

  it("Prints error message when pattern matches 0 files", () => {
    run(["./this-file-doesnt-exist.txt"]);

    expect(reprinter.formatFile).not.toHaveBeenCalled();
    verifyLogMessages([
      [logUtils.LoggerVerboseOption.Normal, expect.stringContaining("No filepaths found for file pattern")],
    ]);
  });

  describe("formatFile throwing errors", () => {
    it("prints message for unknown error", () => {
      reprinter.formatFile.mockImplementationOnce(() => {
        throw new Error("Some error");
      });

      run(["./package.json"]);

      verifyLogMessages([
        [logUtils.LoggerVerboseOption.Normal, expect.stringMatching(/\.\/package\.json - Some error - ([0-9]*)ms$/)],
      ]);
    });

    it("prints message for IgnoredFileError", () => {
      reprinter.formatFile.mockImplementationOnce(() => {
        throw new IgnoredFileError("./package.json");
      });

      run(["./package.json"]);

      verifyLogMessages([
        [
          logUtils.LoggerVerboseOption.Diagnostic,
          expect.stringMatching(/\.\/package\.json - Skipped due to matching ignore pattern - ([0-9]*)ms$/),
        ],
      ]);
    });

    it("prints message for UnsupportedExtensionError", () => {
      reprinter.formatFile.mockImplementationOnce(() => {
        throw new UnsupportedExtensionError("./package.json");
      });

      run(["./package.json"]);

      verifyLogMessages([
        [
          logUtils.LoggerVerboseOption.Normal,
          expect.stringMatching(/\.\/package\.json - No parser could be inferred - ([0-9]*)ms$/),
        ],
      ]);
    });

    it("does not print message for UnsupportedExtensionError if --ignore-unknown is passed", () => {
      reprinter.formatFile.mockImplementationOnce(() => {
        throw new UnsupportedExtensionError("./package.json");
      });

      run(["--ignore-unknown", "./package.json"]);

      verifyLogMessages([]);
    });
  });
});
