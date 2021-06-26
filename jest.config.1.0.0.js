// eslint-disable-next-line @typescript-eslint/no-var-requires
const jestConfig = require("./jest.config");

module.exports = {
  ...jestConfig,
  collectCoverageFrom: [
    "src/tools/utils.ts",
    "src/tools/validate-remark.ts",
    "src/tools/consolidator/consolidator.ts",
    "src/tools/consolidator/interactions/*",
    "src/rmrk1.0.0/classes/*",
  ],
};
