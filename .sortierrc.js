var configs = require("@snowcoders/renovate-config");

// Since this is sortier, we should run the local version since this package can't depend on itself
let sortier = JSON.stringify(configs.sortier);
sortier.replace("sortier", "node bin/index.js");

module.exports = JSON.parse(sortier);
