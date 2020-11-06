/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createPort } from '../common/messaging'

import * as mediaDuration from '../common/mediaDuration'
import * as tabHandlers from '../common/tabHandlers'
import * as types from './types'
import * as utils from './utils'

let lastActivityTime = 0
let lastLocation = ''

// Tracks visited publishers by screen name
const visitedPublishersByScreenName = new Set()

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
  const url = new URL(location.href)
  const screenName = utils.getScreenNameFromUrl(url)

  const firstVisit = !visitedPublishersByScreenName.has(screenName)
  if (firstVisit) {
    visitedPublishersByScreenName.add(screenName)
  }

  const duration = Math.round((Date.now() - lastActivityTime) / 1000)
  mediaDuration.sendMetadata(types.mediaType, screenName, duration, firstVisit)
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

  console.info('Greaselion script loaded: githubAutoContribution.ts')
}

initScript()
