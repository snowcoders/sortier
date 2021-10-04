// import { jest } from "@snowcoders/renovate-config";

export default {
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  preset: "ts-jest/presets/default-esm",
};
