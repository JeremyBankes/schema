const webpack = require("webpack");
const Path = require("path");

/** @type {webpack.Configuration} */
const configuration = {
    mode: "development",
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"],
                            compact: false
                        }
                    },
                    "ts-loader"
                ]
            }
        ]
    },
    resolve: {
        extensions: [".ts"],
        modules: [Path.resolve("node_modules")]
    },
    entry: "./source/index.ts",
    output: {
        path: Path.resolve("build/output"),
        filename: "index.js",
        globalObject: "this",
        library: { name: "Schema", type: "umd" }
    }
};

module.exports = configuration;