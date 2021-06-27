// eslint-disable-next-line @typescript-eslint/no-var-requires
const jestConfig = require("./jest.config");

module.exports = {
  ...jestConfig,
  collectCoverageFrom: [
    "src/rmrk2.0.0/classes/**/*",
    "src/rmrk2.0.0/tools/**/*",
  ],
};
