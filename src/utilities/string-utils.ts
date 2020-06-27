export class StringUtils {
  public static getBlankLineLocations(
    string: string,
    rangeStart = 0,
    rangeEnd: number = string.length
  ) {
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

  // https://stackoverflow.com/questions/14480345/how-to-get-the-nth-occurrence-in-a-string
  public static nthIndexOf(str: string, pat: string, n: number) {
    const L = str.length;
    let i = -1;
    while (n-- && i++ < L) {
      i = str.indexOf(pat, i);
      if (i < 0) break;
    }
    return i;
  }

  public static sentenceCase(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  public static startsWith(text: string, startString: string) {
    return text.indexOf(startString) !== 0;
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
