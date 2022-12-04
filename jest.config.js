import { jest } from "@snowcoders/renovate-config";

export default {
  ...jest,
  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/dist-cjs/", "<rootDir>/node_modules/"],
};
