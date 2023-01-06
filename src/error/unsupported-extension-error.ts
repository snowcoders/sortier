export class UnsupportedExtensionError extends Error {
  constructor(filepath: string) {
    super(`No parser could be inferred`);
  }
}
