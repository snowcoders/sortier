import test from "ava";
import { run } from "./index.js";

// Mocks
// import * as cosmiconfig from "cosmiconfig";
import { Reprinter } from "../reprinter/index.js";
import { ReprinterOptions } from "../reprinter-options.js";
import { LogUtils, LoggerVerboseOption } from "../utilities/log-utils.js";
import sinon from "sinon";

let config: ReprinterOptions;

const logMock = sinon.stub(LogUtils, "log");
const reprinterMock = sinon.stub(Reprinter, "rewriteFile");
const setVerbosityMock = sinon.stub(LogUtils, "setVerbosity");

// TODO
// sinon.replace(cosmiconfig, "cosmiconfigSync", () => {
//   return {
//     search: () => {
//       return {
//         config: config,
//       };
//     },
//   } as any;
// });

test.beforeEach(() => {
  logMock.resetHistory();
  reprinterMock.resetHistory();
  setVerbosityMock.resetHistory();
});

test.afterEach(() => {
  logMock.resetHistory();
  reprinterMock.resetHistory();
  setVerbosityMock.resetHistory();
});

test.after.always(() => {
  logMock.restore();
  reprinterMock.restore();
});

test("Prints message when 0 arguments given", (t) => {
  run([]);

  t.is(logMock.lastCall.firstArg, LoggerVerboseOption.Normal);
});

test("Does not message when 0 arguments given", (t) => {
  run(["./package.json"]);

  t.false(logMock.called);
  t.is(reprinterMock.lastCall.firstArg, "./package.json");
});

test("Throws exception if rewrite fails", (t) => {
  reprinterMock.throws(new Error("Some error"));

  t.throws(() => {
    run(["./package.json"]);
  });

  t.is(logMock.lastCall.args[0], LoggerVerboseOption.Normal);
  t.true(logMock.lastCall.args[1].contains("Some error"));
});

// TODO
// describe("Cosmiconfig settings", () => {
//   it.each<[ReprinterOptions["logLevel"], LoggerVerboseOption]>([
//     ["diagnostic", LoggerVerboseOption.Diagnostic],
//     ["quiet", LoggerVerboseOption.Quiet],
//     ["asdfasdf" as any, LoggerVerboseOption.Normal],
//     [undefined, LoggerVerboseOption.Normal],
//   ])(`Cosmiconfig settings > Sets log level to "%s" when set in config`, (logLevel, expected) => {
//     config = {
//       logLevel: logLevel,
//     };

//     run(["./package.json"]);

//     expect(setVerbosityMock).toHaveBeenCalledTimes(1);
//     expect(setVerbosityMock).toHaveBeenCalledWith(expected);
//   });
// });
