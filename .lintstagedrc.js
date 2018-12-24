var configs = require("@snowcoders/renovate-config");

// Since this is sortier, we should run the local version since this package can't depend on itself
let lintStaged = JSON.stringify(configs.lintStaged);
lintStaged.replace("sortier", "node bin/index.js");

module.exports = JSON.parse(lintStaged);
