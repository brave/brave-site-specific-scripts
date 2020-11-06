/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createPort } from '../common/messaging'

import * as mediaDuration from '../common/mediaDuration'
import * as tabHandlers from '../common/tabHandlers'
import * as types from './types'
import * as publisherInfo from './publisherInfo'

let lastActivityTime = 0
let lastLocation = ''

// Tracks visited publishers by media key
const visitedPublishersByMediaKey = new Set()

const resetActivityTime = () => {
  lastActivityTime = Date.now()
}

const handleOnUpdatedTab = (changeInfo: any) => {
  if (!changeInfo || (!changeInfo.url && changeInfo.status !== 'complete')) {
    return
  }

  if (location.href !== lastLocation) {
    lastLocation = location.href
    resetActivityTime()
  }
}

const sendDuration = () => {
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

    tabHandlers.registerOnUpdatedTab(types.mediaType, handleOnUpdatedTab)
  })

  console.info('Greaselion script loaded: vimeoAutoContribution.ts')
}

initScript()
