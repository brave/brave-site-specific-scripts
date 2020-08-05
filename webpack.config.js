// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin');

// We use a bundler (webpack) since the browser does
// not support es-modules in content-scripts.
module.exports = (env, argv) => {
  const config = {
    devtool: argv.mode === 'development' ? 'inline-source-map' : false,
    entry: {
      ['scripts/brave_rewards/publisher_youtube']: './scripts/brave_rewards/publisher_youtube'
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'Greaselion.json' },
        ]
      })
    ],
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [{loader: 'ts-loader', options: {onlyCompileBundledFiles: true}}],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ],
    }
  }
  // If we're watching, we don't want to clean out the output
  // dir every incremental update.
  if (!argv.watch) {
    config.plugins.unshift(
      new CleanWebpackPlugin()
    )
  }
  return config
}
