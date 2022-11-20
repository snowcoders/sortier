export class StringUtils {
  public static getBlankLineLocations(string: string, rangeStart = 0, rangeEnd: number = string.length) {
    const regex = /\n\s*\n/gim;
    let result: null | RegExpExecArray;
    const contextBarrierIndices: number[] = [];
    while ((result = regex.exec(string))) {
      if (rangeStart < result.index && result.index < rangeEnd) {
        contextBarrierIndices.push(result.index);
      }
    }
    return contextBarrierIndices;
  }

  public static stringEndsWithAny(text: string, endings: string[]) {
    // If the user didn't override the parser type, try to infer it
    let endsWithAny = false;
    for (const extension of endings) {
      endsWithAny = endsWithAny || text.endsWith(extension);
    }
    return endsWithAny;
  }
}
