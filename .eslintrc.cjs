const configs = require("@snowcoders/renovate-config");

const { eslint } = configs;

module.exports = {
  ...eslint,
  env: {
    es2017: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/typescript",
  ],
  rules: {
    ...eslint.rules,
    // https://github.com/snowcoders/sortier/issues/1175
    "@typescript-eslint/no-explicit-any": "warn",
    "import/extensions": ["error", "ignorePackages"],
  },
};
