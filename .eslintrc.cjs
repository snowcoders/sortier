const { buildEslintConfig } = require("@snowcoders/renovate-config");

module.exports = {
  ...buildEslintConfig({
    esm: true,
    prettier: true,
    typescript: true,
  }),
  env: {
    es2019: true,
    node: true,
  },
};
