// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const rewardsDir = 'scripts/brave_rewards'
const togetherDir = 'scripts/brave_talk'

const allEntries = [
  `${rewardsDir}/publisher/github/githubBase`,
  `${rewardsDir}/publisher/github/githubAutoContribution`,
  `${rewardsDir}/publisher/github/githubInlineTipping`,
  `${rewardsDir}/publisher/reddit/redditBase`,
  `${rewardsDir}/publisher/reddit/redditAutoContribution`,
  `${rewardsDir}/publisher/reddit/redditInlineTipping`,
  `${rewardsDir}/publisher/twitch/twitchBase`,
  `${rewardsDir}/publisher/twitch/twitchAutoContribution`,
  `${rewardsDir}/publisher/twitter/twitterBase`,
  `${rewardsDir}/publisher/twitter/twitterAutoContribution`,
  `${rewardsDir}/publisher/twitter/twitterInlineTipping`,
  `${rewardsDir}/publisher/vimeo/vimeoBase`,
  `${rewardsDir}/publisher/vimeo/vimeoAutoContribution`,
  `${rewardsDir}/publisher/youtube/youtubeBase`,
  `${rewardsDir}/publisher/youtube/youtubeAutoContribution`,
  `${togetherDir}/confabs/oneOnOneMeetings`
]

// We use a bundler (webpack) since the browser does
// not support es-modules in content-scripts.
module.exports = (env, argv) => {
  const config = {
    devtool: argv.mode === 'development' ? 'inline-source-map' : false,
    entry: allEntries.reduce((e, script) => {
      e[script] = `./${script}`
      return e
    }, {}),
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'Greaselion.json' },
          { from: `${rewardsDir}/publisher/github/_locales/**/*` },
          { from: `${rewardsDir}/publisher/reddit/_locales/**/*` },
          { from: `${rewardsDir}/publisher/twitter/_locales/**/*` }
        ]
      })
    ],
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'dist')
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [{
            loader: 'ts-loader',
            options: {
              onlyCompileBundledFiles: true,
              allowTsInNodeModules: true
            }
          }]
        }
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
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
