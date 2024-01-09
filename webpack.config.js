const path = require('path');
const pkg = require('./package.json');
const process = require('process');
const camelcase = require('camelcase');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

let config = {
  mode: process.env.NODE_ENV,
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
  devServer: {
    port: 8000,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "demo"),
          to: path.resolve(__dirname, "dist")
        }
      ]
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "demo", "demo-constraint.html"),
    })
  ]
};

module.exports = config;
