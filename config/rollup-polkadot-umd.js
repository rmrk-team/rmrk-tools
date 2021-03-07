import babel from "@rollup/plugin-babel";
import cjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import node from "@rollup/plugin-node-resolve";

export default {
  input: "./umd/polkadot.ts",
  output: {
    file: "./umd/polkadot.min.js",
    format: "iife",
    name: "polkadotUtils",
    inlineDynamicImports: true,
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

    node(),

    cjs({
      include: "node_modules/**",
    }),

    json(),

    terser(),
  ],
};
