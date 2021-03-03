import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import babel from "@rollup/plugin-babel";
import rollupTypescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import nodePolyfills from "rollup-plugin-node-polyfills";
import json from "@rollup/plugin-json";
import pkg from "./package.json";
// const input = ["src/**/*.ts"];

const extensions = [".js", ".ts"];

const commonConfig = {
  input: "./src/index.ts",
  external: ["@polkadot/util", "@polkadot/util-crypto"],
};

export default [
  {
    // UMD
    ...commonConfig,
    input: "./src/bundle.ts",
    plugins: [
      babel({
        babelHelpers: "bundled",
      }),
      resolve({
        browser: true,
        jsnext: true,
        extensions,
      }),
      commonjs(),
      nodePolyfills(),
      rollupTypescript(),
      json(),
      terser(),
    ],
    output: {
      file: `dist/${pkg.name}.min.js`,
      format: "umd",
      name: "rmrkTools",
      sourcemap: true,
    },
  },

  // ESM and CJS
  {
    ...commonConfig,
    plugins: [
      babel({
        babelHelpers: "bundled",
      }),
      resolve({
        extensions,
        jsnext: true,
      }),
      commonjs(),
      json(),
      rollupTypescript(),
    ],
    output: [
      {
        dir: "dist/esm",
        format: "esm",
        exports: "named",
        sourcemap: true,
      },
      {
        dir: "dist/cjs",
        format: "cjs",
        exports: "named",
        sourcemap: true,
      },
    ],
  },
];
