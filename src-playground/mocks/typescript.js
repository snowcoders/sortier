/* eslint-disable */
// @ts-nocheck
// const packageJson = require("../../node_modules/typescript/package.json");
// const json = JSON.parse(packageJson);
// const { version } = json;

if (self.process == null) {
  // @ts-ignore
  self.process = {
    env: {},
    cwd: () => ".",
  };
}

// Available versions
importScripts(`https://unpkg.com/typescript/lib/typescript.js`);

module.exports = self.ts;
