/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createPort } from '../common/messaging'

import * as tabHandlers from '../common/tabHandlers'
import * as webRequestHandlers from '../common/webRequestHandlers'

import * as auth from './auth'
import * as tipping from './tipping'
import * as types from './types'

const handleOnSendHeadersWebRequest = (mediaType: string, details: any) => {
  if (mediaType !== types.mediaType || !details || !details.requestHeaders) {
    return
  }

  if (auth.processRequestHeaders(details.requestHeaders)) {
    tipping.configure()
  }
}

const handleOnUpdatedTab = (changeInfo: any) => {
  if (!changeInfo || !changeInfo.url) {
    return
  }

  tipping.configure()
}

const initScript = () => {
  // Don't run in incognito context
  if (chrome.extension.inIncognitoContext) {
    return
  }

  createPort()

  // Configure tip action on visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      tipping.configure()
    }
  })

  webRequestHandlers.registerOnSendHeadersWebRequest(
    types.mediaType,
    types.sendHeadersUrls,
    types.sendHeadersExtra,
    handleOnSendHeadersWebRequest)
  tabHandlers.registerOnUpdatedTab(types.mediaType, handleOnUpdatedTab)

  console.info('Greaselion script loaded: twitterInlineTipping.ts')
}

initScript()
