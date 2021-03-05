import { terser } from "rollup-plugin-terser";
import config from "./rollup-umd";

config.output = {
  file: "./umd/rmrk-tools.min.js",
  format: "umd",
  name: "rmrkTools",
};

config.plugins = [terser()];

export default config;
