import { run } from "./index.js";

// Mocks
import { jest } from "@jest/globals";
import realCosmiconfig from "cosmiconfig";
import { Reprinter } from "../reprinter/index.js";
import { ReprinterOptions } from "../reprinter-options.js";
import { LogUtils, LoggerVerboseOption } from "../utilities/log-utils.js";

jest.mock("cosmiconfig");
const cosmiconfig = realCosmiconfig as jest.Mocked<typeof realCosmiconfig>;

// TODO: #1320 - Jest does't support mocking of ESM imports
xdescribe("cli", () => {
  let logMock: jest.SpiedFunction<typeof LogUtils["log"]>;
  let reprinterMock: jest.SpiedFunction<typeof Reprinter["rewriteFile"]>;
  let setVerbosityMock: jest.SpiedFunction<typeof LogUtils["setVerbosity"]>;
  let config: ReprinterOptions;

  beforeAll(() => {
    logMock = jest.spyOn(LogUtils, "log") as any;
    reprinterMock = jest.spyOn(Reprinter, "rewriteFile") as any;
    setVerbosityMock = jest.spyOn(LogUtils, "setVerbosity") as any;
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
