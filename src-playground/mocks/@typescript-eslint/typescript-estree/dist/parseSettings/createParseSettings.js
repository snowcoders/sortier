export const createParseSettings = (code, options) => {
  return {
    ...options,
    filePath: "/test.js",
    code: code,
  };
};
