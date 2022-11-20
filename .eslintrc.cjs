const configs = require("@snowcoders/renovate-config");

const { buildEslintConfig } = configs;

module.exports = {
  ...buildEslintConfig({
    esm: true,
    prettier: true,
    typescript: true,
  }),
  env: {
    es2017: true,
    node: true,
  },
};
