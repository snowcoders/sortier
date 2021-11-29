import { jest } from "@snowcoders/renovate-config";

export default {
  ...jest,
  projects: ["<rootDir>/src"],
  testURL: undefined,
};
