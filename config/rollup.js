import babel from "@rollup/plugin-babel";
import cjs from "@rollup/plugin-commonjs";
import node from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import strip from "@rollup/plugin-strip";

export default {
  input: "./dist/rmrk2.0.0/index.js",
  output: {
    file: "./dist/rmrk2.0.0/index.es.js",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    babel({
      exclude: "node_modules/**",
      sourceMap: true,
      babelrc: false,
      extensions: [".ts"],
      presets: [
        "@babel/typescript",
        [
          "@babel/preset-env",
          {
            targets: { browsers: "defaults, not ie 11", node: true },
            modules: false,
            useBuiltIns: false,
            loose: true,
          },
        ],
      ],
    }),

    cjs({
      sourceMap: true,
    }),

    node({
      extensions: [".ts"],
    }),

    strip({
      include: ["**/*.(mjs|js|ts)"],
    }),

    json(),
  ],
};
