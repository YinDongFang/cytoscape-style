const path = require('path');
const pkg = require('./package.json');
const camelcase = require('camelcase');
const HtmlWebpackPlugin = require('html-webpack-plugin');

let config = {
  move: "production",
  devtool: false,
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: 'index.js',
    library: camelcase(pkg.name),
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' }
    ]
  },
  optimization: {
    minimize: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Custom template',
    })
  ]
};

module.exports = config;
