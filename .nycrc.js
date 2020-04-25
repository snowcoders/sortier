module.exports = {
  all: true,
  exclude: ["src/**/*.test.ts"],
  extends: "@istanbuljs/nyc-config-typescript",
  extension: [".ts"],
  include: ["src/**/*.ts"],
  instrument: true,
  reporter: ["text-summary", "html"],
  sourceMap: true,
};
