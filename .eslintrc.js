var configs = require("@snowcoders/renovate-config");

module.exports = {
  ...configs.eslint,
  rules: {
    ...configs.eslint.rules,
    "@typescript-eslint/no-explicit-any": "off",
  },
};
