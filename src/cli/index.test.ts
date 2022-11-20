// Imports - non-mocked dependencies
import { expect, it, jest, xdescribe, afterEach } from "@jest/globals";

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

// TODO: #1320 - Jest does't support mocking of ESM imports
xdescribe("cli", () => {
  afterEach(() => {
    logUtils.LogUtils.log.mockReset();
    logUtils.LogUtils.setVerbosity.mockReset();
  });

  it("Prints message when 0 arguments given", () => {
    run([]);

    expect(logUtils.LogUtils.log).toHaveBeenLastCalledWith(MockLoggerVerboseOption.Normal, expect.anything());
  });

  it("Does not message when 0 arguments given", () => {
    run(["./package.json"]);

    expect(logUtils.LogUtils.log).not.toHaveBeenCalled();
    expect(reprinter.formatFile).toHaveBeenLastCalledWith("./package.json", expect.anything());
  });

  it("Throws exception if rewrite fails", () => {
    reprinter.formatFile.mockImplementationOnce(() => {
      throw new Error("Some error");
    });

    expect(() => {
      run(["./package.json"]);
    }).toThrow();

    expect(logUtils.LogUtils.log).toHaveBeenLastCalledWith(
      MockLoggerVerboseOption.Normal,
      expect.stringContaining("Some error")
    );
  });
});
