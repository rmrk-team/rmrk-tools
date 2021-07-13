import config from "./rollup";

config.output = {
  file: "./dist/rmrk2.0.0/index.cjs",
  format: "cjs",
  name: "rmrkTools",
  sourcemap: true,
};

export default config;
