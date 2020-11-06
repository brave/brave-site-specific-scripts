/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createPort } from '../common/messaging'

import * as mediaDuration from '../common/mediaDuration'
import * as publisherInfo from './publisherInfo'
import * as types from './types'
import * as utils from './utils'

let lastActivityTime = 0

// Tracks visited publishers by media key
const visitedPublishersByMediaKey = new Set()

const resetActivityTime = () => {
  lastActivityTime = Date.now()
}

const sendDuration = () => {
  // Only calculate duration for channel and user paths, as we
  // already handle videos via our OnCompletedRequest handlers
  // and we don't want to count them twice
  if (utils.isChannelPath(location.pathname) ||
      utils.isUserPath(location.pathname)) {
    publisherInfo.get()
      .then((info) => {
        const firstVisit = !visitedPublishersByMediaKey.has(info.mediaKey)
        if (firstVisit) {
          visitedPublishersByMediaKey.add(info.mediaKey)
        }

        const mediaId = info.mediaKey.replace(`${types.mediaType}_`, '')
        const duration = Math.round((Date.now() - lastActivityTime) / 1000)
        mediaDuration.sendMetadata(types.mediaType, mediaId, duration, firstVisit)
      })
      .catch((error) => {
        throw new Error(`Failed to retrieve publisher data: ${error}`)
      })
  }
}

const initScript = () => {
  // Don't run in incognito context
  if (chrome.extension.inIncognitoContext) {
    return
  }

  createPort((success: boolean) => {
    if (!success) {
      console.error('Failed to initialize communications port')
      return
    }

    // Calculate duration on visibility change
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        resetActivityTime()
      } else {
        sendDuration()
      }
    })

    if (document.visibilityState === 'visible') {
      resetActivityTime()
    }

    // Reset activity time on page data update
    // Note: Can't use 'yt-navigate-finish' for this, as data may not have
    // finished loading by then
    document.addEventListener('yt-page-data-updated', function () {
      resetActivityTime()
    })
  })

  console.info('Greaselion script loaded: youtubeAutoContribution.ts')
}

initScript()
