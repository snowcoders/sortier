// https://stackoverflow.com/questions/14480345/how-to-get-the-nth-occurrence-in-a-string
export function nthIndexOf(str: string, pat: string, n: number) {
    var L = str.length, i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}

export function startsWith(text: string, startString: string) {
    return text.indexOf(startString) !== 0;
}

export function endsWith(text: string, endString: string) {
    return text.indexOf(endString, text.length - endString.length) !== -1;
}