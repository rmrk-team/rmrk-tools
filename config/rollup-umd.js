export default {
  input: "./dist/index.es.js",
  output: {
    file: "./umd/rmrk-tools.js",
    format: "umd",
    name: "rmrkTools",
    inlineDynamicImports: true,
  },
};
