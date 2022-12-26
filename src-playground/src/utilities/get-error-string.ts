export function getErrorString(huh: unknown) {
  if (huh instanceof Error) {
    return huh.toString();
  } else if (typeof huh === "string") {
    return huh;
  } else {
    return JSON.stringify(huh);
  }
}
