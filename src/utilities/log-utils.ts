type ArgumentType<T> = T extends (...arg1: infer U) => any ? U : any;

export enum LoggerVerboseOption {
  Quiet,
  Normal,
  Diagnostic,
}

export class LogUtils {
  private static verbosity: LoggerVerboseOption = LoggerVerboseOption.Normal;

  public static log(verbosity: LoggerVerboseOption, ...args: ArgumentType<typeof console.log>) {
    if (verbosity === LoggerVerboseOption.Quiet) {
      return;
    }
    if (verbosity <= LogUtils.verbosity) {
      console.log(...args);
    }
  }

  public static setVerbosity(newVerbosity: LoggerVerboseOption) {
    LogUtils.verbosity = newVerbosity;
  }
}
