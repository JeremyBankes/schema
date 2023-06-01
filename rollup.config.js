import typescript from "@rollup/plugin-typescript";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";

/** @type {import("rollup").RollupOptions} */
export default {
    input: "source/index.ts",
    output: {
        file: "build/index.js",
        name: "Schema",
        format: "cjs",
        sourcemap: false,
        exports: "named"
    },
    plugins: [
        typescript(),
        getBabelOutputPlugin({ presets: [["@babel/preset-env", { modules: "umd" }]] })
    ]
};