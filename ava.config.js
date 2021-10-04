export default {
  extensions: {
    ts: "module",
  },
  files: ["src/**/*.test.{js,jsx,ts,tsx}"],
  nonSemVerExperiments: {
    configurableModuleFormat: true,
  },
  nodeArguments: ["--loader=ts-node/esm"],
  verbose: true,
};
