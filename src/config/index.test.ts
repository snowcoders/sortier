// Imports - non-mocked dependencies
import { describe, expect, it, jest, beforeAll, afterEach } from "@jest/globals";
import type { cosmiconfigSync } from "cosmiconfig";

// Imports - Mocked imports
jest.unstable_mockModule("cosmiconfig", () => ({
  cosmiconfigSync: jest.fn(),
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
const cosmiconfig = jest.mocked(await import("cosmiconfig"));
const logUtils = jest.mocked(await import("../utilities/log-utils.js"));

// Imports - File to run tests on
const { resolveOptions } = await import("./index.js");

// TODO Figure out how to stub cosmiconfig
describe("Cosmiconfig settings", () => {
  let config: Partial<ReturnType<ReturnType<typeof cosmiconfigSync>["search"]>> = {};

  beforeAll(() => {
    cosmiconfig.cosmiconfigSync.mockImplementation(() =>
      // @ts-expect-error: Only implementing what we need for testing
      ({
        search: () => {
          return {
            config: {},
            filepath: "test",
            isEmpty: false,
            ...config,
          };
        },
      })
    );
  });

  afterEach(() => {
    logUtils.LogUtils.log.mockReset();
    logUtils.LogUtils.setVerbosity.mockReset();
  });

  it.each`
    logLevel             | loggerVerboseOption
    ${"diagnostic"}      | ${MockLoggerVerboseOption.Diagnostic}
    ${"quiet"}           | ${MockLoggerVerboseOption.Quiet}
    ${"asdfasdf" as any} | ${MockLoggerVerboseOption.Normal}
    ${undefined}         | ${MockLoggerVerboseOption.Normal}
  `(
    `Sets log level to "$loggerVerboseOption" when set to "$logLevel" in config`,
    ({ logLevel, loggerVerboseOption }) => {
      config = {
        config: {
          logLevel: logLevel,
        },
      };

      resolveOptions("./package.json");

      expect(logUtils.LogUtils.setVerbosity).toHaveBeenCalledTimes(1);
      expect(logUtils.LogUtils.setVerbosity).toHaveBeenCalledWith(loggerVerboseOption);
    }
  );
});
