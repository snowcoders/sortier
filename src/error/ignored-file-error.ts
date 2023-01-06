export class IgnoredFileError extends Error {
  constructor(filepath: string) {
    super(`Skipped due to matching ignore pattern`);
  }
}
