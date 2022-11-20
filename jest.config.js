import { jest } from "@snowcoders/renovate-config";

export default {
  ...jest,
  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
};
