/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

export const braveRewardsExtensionId = 'jidkidbbcafjabdphckchenhfomhnfma'

export interface MediaMetaData {
  user: {
    id: string
    screenName: string
    fullName: string
    favIconUrl: string
  }
  post: {
    id: string
    timestamp: string
    text: string
  }
}
