const configs = require("@snowcoders/renovate-config");

module.exports = {
  ...configs.releaseIt,
  npm: {
    skipChecks: true,
  },
};
