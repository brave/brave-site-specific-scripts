/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createPort } from '../common/messaging'

import * as webRequestHandlers from '../common/webRequestHandlers'

import * as mediaDuration from './mediaDuration'
import * as publisherInfo from './publisherInfo'
import * as types from './types'
import * as utils from './utils'

const mediaDurationUrlPattern = 'https://www.youtube.com/api/stats/watchtime?*'

const handleOnCompletedWebRequest = (mediaType: string, details: any) => {
  if (mediaType !== types.mediaType) {
    return
  }

  if (!details || !details.url) {
    return
  }

  const url = new URL(details.url)
  mediaDuration.sendMetadataFromUrl(url)
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
          webRequestHandlers.registerOnCompletedWebRequestHandler(
            types.mediaType,
            mediaDurationUrlPattern,
            handleOnCompletedWebRequest)
          publisherInfo.send()
        }, 200)
      }
    })

    // Load publisher info and register webRequest.OnCompleted handler
    // on visibility change
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        webRequestHandlers.registerOnCompletedWebRequestHandler(
          types.mediaType,
          mediaDurationUrlPattern,
          handleOnCompletedWebRequest)
        publisherInfo.send()
      }
    })

    // Load publisher info and register webRequest.OnCompleted handler
    // on page data update
    // Note: Can't use 'yt-navigate-finish' for this, as data may not have
    // finished loading by then
    document.addEventListener('yt-page-data-updated', function () {
      if (document.visibilityState === 'visible') {
        webRequestHandlers.registerOnCompletedWebRequestHandler(
          types.mediaType,
          mediaDurationUrlPattern,
          handleOnCompletedWebRequest)
        publisherInfo.send()
      }
      mediaDuration.setFirstVisit(true)
    })
  })

  console.info('Greaselion script loaded: youtubeBase.ts')
}

initScript()
