const configs = require("@snowcoders/renovate-config");

const { eslint } = configs;

module.exports = {
  ...eslint,
  env: {
    es2019: true,
    node: true,
  },
};
