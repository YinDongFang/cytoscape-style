const path = require('path');
const pkg = require('./package.json');
const process = require('process');
const camelcase = require('camelcase');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

let config = {
  mode: process.env.NODE_ENV,
  devtool: false,
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: 'index.js',
    library: camelcase(pkg.name),
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.ts$/, exclude: /node_modules/, loader: 'ts-loader',
        options: {
          compilerOptions: {
            declaration: true,
            outDir: path.resolve(__dirname, 'dist', 'types'), // 指定声明文件输出目录
          },
        },
      }
    ]
  },
  devServer: {
    port: 8000,
  },
  plugins: [
    new CleanWebpackPlugin(),
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
  ],
  externals: {
    cytoscape: 'cytoscape'
  }
};

module.exports = config;
