// @ts-nocheck
const packageJson = require("../node_modules/typescript/package.json");

if (self.process == null) {
  // @ts-ignore
  self.process = {
    cwd: () => ".",
    env: {},
  };
}

const json = JSON.parse(packageJson);
const { version } = json;

// Available versions
// https://typescript.azureedge.net/indexes/releases.json
importScripts(
  `https://typescript.azureedge.net/cdn/${version}/typescript/lib/typescript.js`
);

module.exports = self.ts;
