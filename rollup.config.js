import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import rollupTypescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

const extensions = [".js", ".ts", ".mjs"];

export default [
  // ESM and CJS
  {
    input: "./src/index.ts",
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
