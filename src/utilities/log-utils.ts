type ArgumentType<T> = T extends (...arg1: infer U) => any ? U : any;

export enum LoggerVerboseOption {
  Quiet,
  Normal,
  Diagnostic
}

export class Logger {
  private static verbosity: LoggerVerboseOption = LoggerVerboseOption.Normal;

  public static setVerbosity(newVerbosity: LoggerVerboseOption) {
    Logger.verbosity = newVerbosity;
  }

  public static log(
    verbosity: LoggerVerboseOption,
    ...args: ArgumentType<typeof console.log>
  ) {
    if (verbosity === LoggerVerboseOption.Quiet) {
      return;
    }
    if (verbosity <= Logger.verbosity) {
      // tslint:disable-next-line:no-console
      console.log(...args);
    }
  }
}
