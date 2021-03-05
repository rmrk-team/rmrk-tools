export default {
  input: "./dist/esm/index.js",
  output: {
    file: "./umd/rmrk-tools.js",
    format: "umd",
    name: "rmrkTools",
    inlineDynamicImports: true,
  },
};
