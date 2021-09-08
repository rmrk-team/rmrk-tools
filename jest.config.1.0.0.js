// eslint-disable-next-line @typescript-eslint/no-var-requires
const jestConfig = require("./jest.config");

module.exports = {
  ...jestConfig,
  collectCoverageFrom: [
    "src/rmrk1.0.0/tools/**/*.ts",
    "src/rmrk1.0.0/classes/**/*.ts",
  ],
};
