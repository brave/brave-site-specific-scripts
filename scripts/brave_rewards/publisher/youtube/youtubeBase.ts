/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createPort } from '../common/messaging'

import * as webRequestHandlers from '../common/webRequestHandlers'

import * as mediaDuration from './mediaDuration'
import * as publisherInfo from './publisherInfo'
import * as utils from './utils'

const mediaDurationUrlPattern = '^https://www.youtube.com/api/stats/watchtime?'

let onCompletedWebRequestHandlerRegistered = false
const registerOnCompletedWebRequestHandler = () => {
  // TODO: remove timeout
  setTimeout(() => {
    if (onCompletedWebRequestHandlerRegistered)
      return
    onCompletedWebRequestHandlerRegistered = true
    console.log('registerOnCompletedWebRequestHandler')

    webRequestHandlers.registerOnBeforeRequestHandler(
      mediaDurationUrlPattern, (event) => {
        if (!event.url)
          return
        const url = new URL(event.url)
        mediaDuration.sendMetadataFromUrl(url)
      }
    )
    publisherInfo.send()
  }, 5000);
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

    // Load publisher info and register webRequest.OnCompleted handler
    // when document finishes loading
    // Note: Not needed for video paths, as 'yt-page-data-updated' handles those
    document.addEventListener('readystatechange', function () {
      if (document.readyState === 'complete' &&
          document.visibilityState === 'visible' &&
          !utils.isVideoPath(location.pathname)) {
        setTimeout(() => {
          registerOnCompletedWebRequestHandler()
        }, 200)
      }
    })

    // Load publisher info and register webRequest.OnCompleted handler
    // on visibility change
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        registerOnCompletedWebRequestHandler()
      }
    })

    // Load publisher info and register webRequest.OnCompleted handler
    // on page data update
    // Note: Can't use 'yt-navigate-finish' for this, as data may not have
    // finished loading by then
    document.addEventListener('yt-page-data-updated', function () {
      if (document.visibilityState === 'visible') {
        registerOnCompletedWebRequestHandler()
      }
      mediaDuration.setFirstVisit(true)
    })
  })

  console.info('Greaselion script loaded: youtubeBase.ts')
}

initScript()
