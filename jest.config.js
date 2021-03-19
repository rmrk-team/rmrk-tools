module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@polkadot|@babel/runtime/helpers/esm/))",
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/tools/utils.ts",
    "src/tools/validate-remark.ts",
    "src/tools/consolidator/consolidator.ts",
    "src/tools/consolidator/interactions/*",
    "src/rmrk1.0.0/classes/*",
  ],
};
