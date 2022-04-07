import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.ts",
  output: {
    file: "build/bundle.min.js",
    format: "iife",
    name: "version",
    plugins: [terser()],
  },
  plugins: [typescript()],
};
