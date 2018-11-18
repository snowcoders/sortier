import { expect } from "chai";
import * as sinon from "sinon";

import { run } from "../index";

// Mocks
import { Reprinter } from "../../reprinter";
import { LoggerVerboseOption, LogUtils } from "../../utilities/log-utils";

describe("cli", () => {
  let logMock: sinon.SinonStub;
  let reprinterMock: sinon.SinonStub;

  before(() => {
    logMock = sinon.stub(LogUtils, "log");
    reprinterMock = sinon.stub(Reprinter, "rewrite");
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
});
