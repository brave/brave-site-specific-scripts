// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin');

// We use a bundler (webpack) since the browser does
// not support es-modules in content-scripts.
module.exports = (env, argv) => ({
  devtool: argv.mode === 'development' ? 'inline-source-map' : false,
  entry: {
    ['publisher-ads/wsjgroup']: './publisher-ads/wsjgroup',
    ['publisher-ads/washingtonpost']: './publisher-ads/washingtonpost',
    ['publisher-ads/marketwatch']: './publisher-ads/marketwatch',
    ['publisher-ads/gpt-site']: './publisher-ads/gpt-site'
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin([
      { from: 'Greaselion.json' },
    ]),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
})
