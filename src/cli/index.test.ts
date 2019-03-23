import { expect } from "chai";

import * as sinon from "sinon";

import { run } from "./index";

// Mocks
import * as cosmiconfig from "cosmiconfig";
import { Reprinter } from "../reprinter";
import { LoggerVerboseOption, LogUtils } from "../utilities/log-utils";

describe("cli", () => {
  let logMock: sinon.SinonStubbedInstance<any>;
  let reprinterMock: sinon.SinonStubbedInstance<any>;

  before(() => {
    logMock = sinon.stub(LogUtils, "log");
    reprinterMock = sinon.stub(Reprinter, "rewriteFile");
  });

  beforeEach(() => {
    logMock.reset();
    reprinterMock.reset();
  });

  afterEach(() => {
    logMock.reset();
    reprinterMock.reset();
  });

  after(() => {
    logMock.restore();
    reprinterMock.restore();
  });

  it("Prints message when 0 arguments given", () => {
    run([]);

    expect(logMock.lastCall.args[0]).to.equal(LoggerVerboseOption.Normal);
    expect(logMock.lastCall.args[1]).not.to.have.length(0);
  });

  it("Does not message when 0 arguments given", () => {
    run(["./package.json"]);

    expect(logMock.lastCall).to.be.null;
    expect(reprinterMock.lastCall.args[0]).to.contain("/package.json");
  });

  it("Prints error message if rewrite fails", () => {
    reprinterMock.throws("Some error");

    run(["./package.json"]);

    expect(logMock.lastCall.args[0]).to.equal(LoggerVerboseOption.Normal);
    expect(logMock.lastCall.args[1]).to.contain("Some error");
  });

  // TODO Figure out how to stub cosmiconfig
  xdescribe("Cosmiconfig settings", () => {
    let setVerbosityMock: sinon.SinonStubbedInstance<any>;
    let cosmiconfigMock: sinon.SinonStubbedInstance<any>;
    let config: Object;

    before(() => {
      setVerbosityMock = sinon.stub(LogUtils, "setVerbosity");
      cosmiconfigMock = sinon.stub(cosmiconfig);
      cosmiconfigMock.returns({
        searchSync: () => {
          return {
            config: config
          };
        }
      });
    });

    afterEach(() => {
      cosmiconfigMock.reset();
    });

    after(() => {
      cosmiconfigMock.restore();
    });

    it("Sets log level to diagnostic when set in config", () => {
      config = {
        logLevel: "diagnostic"
      };

      run(["./package.json"]);

      expect(setVerbosityMock.callCount).to.equal(1);
      expect(reprinterMock.lastCall.args[0]).to.be(
        LoggerVerboseOption.Diagnostic as any
      );
    });

    it("Sets log level to quiet when set in config", () => {
      config = {
        logLevel: "quiet"
      };

      run(["./package.json"]);

      expect(setVerbosityMock.callCount).to.equal(1);
      expect(reprinterMock.lastCall.args[0]).to.be(
        LoggerVerboseOption.Quiet as any
      );
    });

    it("Sets log level to normal when invalid in config", () => {
      config = {
        logLevel: "asdfasdf"
      };

      run(["./package.json"]);

      expect(setVerbosityMock.callCount).to.equal(1);
      expect(reprinterMock.lastCall.args[0]).to.be(
        LoggerVerboseOption.Normal as any
      );
    });
  });
});
