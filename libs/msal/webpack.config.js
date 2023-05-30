/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
	entry: "./main.ts",
	target: "web",
	output: {
		path: __dirname,
		filename: "main.js",
		libraryTarget: "umd",
	},
	plugins: [
		new webpack.ProvidePlugin({
			Buffer: ["buffer", "Buffer"],
		}),
		new webpack.ProvidePlugin({
			process: "process/browser",
		}),
	],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.svg?$/,
				type: "asset/source",
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
		mainFields: ["browser", "module", "main"],
		fallback: {
			crypto: require.resolve("crypto-browserify"),
			http: require.resolve("stream-http"),
			https: require.resolve("https-browserify"),
			net: false,
			path: require.resolve("path-browserify"),
			process: require.resolve("process/browser"),
			stream: require.resolve("stream-browserify"),
			tls: false,
			url: require.resolve("url/"),
			util: require.resolve("util/"),
		},
	},
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin({ extractComments: false })],
	},
};
