import { run } from "./index";

// Mocks
import * as realCosmiconfig from "cosmiconfig";
import { mocked } from "ts-jest";
import { Reprinter } from "../reprinter";
import { ReprinterOptions } from "../reprinter-options";
import { LogUtils, LoggerVerboseOption } from "../utilities/log-utils";

jest.mock("cosmiconfig");

const cosmiconfig = mocked(realCosmiconfig);

describe("cli", () => {
  let logMock: jest.SpyInstance<void, any>;
  let reprinterMock: jest.SpyInstance<void, any>;
  let setVerbosityMock: jest.SpyInstance<void, any>;
  let config: ReprinterOptions;

  beforeAll(() => {
    logMock = jest.spyOn(LogUtils, "log");
    reprinterMock = jest.spyOn(Reprinter, "rewriteFile");
    setVerbosityMock = jest.spyOn(LogUtils, "setVerbosity");
    cosmiconfig.cosmiconfigSync.mockImplementation(() => {
      return {
        search: () => {
          return {
            config: config,
          };
        },
      } as any;
    });
  });

  beforeEach(() => {
    logMock.mockReset();
    reprinterMock.mockReset();
    setVerbosityMock.mockReset();
  });

  afterEach(() => {
    logMock.mockReset();
    reprinterMock.mockReset();
    setVerbosityMock.mockReset();
  });

  afterAll(() => {
    logMock.mockRestore();
    reprinterMock.mockRestore();
    cosmiconfig.cosmiconfigSync.mockRestore();
  });

  it("Prints message when 0 arguments given", () => {
    run([]);

    expect(logMock).toHaveBeenLastCalledWith(
      LoggerVerboseOption.Normal,
      expect.anything()
    );
  });

  it("Does not message when 0 arguments given", () => {
    run(["./package.json"]);

    expect(logMock).not.toHaveBeenCalled();
    expect(reprinterMock).toHaveBeenLastCalledWith(
      "./package.json",
      expect.anything()
    );
  });

  it("Throws exception if rewrite fails", () => {
    reprinterMock.mockImplementationOnce(() => {
      throw new Error("Some error");
    });

    expect(() => {
      run(["./package.json"]);
    }).toThrow();

    expect(logMock).toHaveBeenLastCalledWith(
      LoggerVerboseOption.Normal,
      expect.stringContaining("Some error")
    );
  });

  // TODO Figure out how to stub cosmiconfig
  describe("Cosmiconfig settings", () => {
    it.each<[ReprinterOptions["logLevel"], LoggerVerboseOption]>([
      ["diagnostic", LoggerVerboseOption.Diagnostic],
      ["quiet", LoggerVerboseOption.Quiet],
      ["asdfasdf" as any, LoggerVerboseOption.Normal],
      [undefined, LoggerVerboseOption.Normal],
    ])(`Sets log level to "%s" when set in config`, (logLevel, expected) => {
      config = {
        logLevel: logLevel,
      };

      run(["./package.json"]);

      expect(setVerbosityMock).toHaveBeenCalledTimes(1);
      expect(setVerbosityMock).toHaveBeenCalledWith(expected);
    });
  });
});
