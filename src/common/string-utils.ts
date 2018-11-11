// https://stackoverflow.com/questions/14480345/how-to-get-the-nth-occurrence-in-a-string
export function nthIndexOf(str: string, pat: string, n: number) {
  var L = str.length;
  var i = -1;
  while (n-- && i++ < L) {
    i = str.indexOf(pat, i);
    if (i < 0) break;
  }
  return i;
}

export function startsWith(text: string, startString: string) {
  return text.indexOf(startString) !== 0;
}

export function sentenceCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function stringEndsWithAny(text: string, endings: string[]) {
  // If the user didn't override the parser type, try to infer it
  let endsWithAny = false;
  for (let extension of endings) {
    endsWithAny = endsWithAny || text.endsWith(extension);
  }
  return endsWithAny;
}
