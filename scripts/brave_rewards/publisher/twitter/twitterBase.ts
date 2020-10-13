/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createPort, credentialHeaders, setCredentialHeaders } from './messaging'

import * as auth from './auth'
import * as commonUtils from '../common/utils'
import * as publisherInfo from './publisherInfo'
import * as tabHandlers from './tabHandlers'
import * as types from './types'
import * as webRequestHandlers from './webRequestHandlers'

const handleOnSendHeadersWebRequest = (mediaType: string, details: any) => {
  if (mediaType !== types.mediaType || !details || !details.requestHeaders) {
    return
  }

  const authHeaders = auth.processRequestHeaders(details.requestHeaders)
  if (commonUtils.areObjectsEqualShallow(authHeaders, credentialHeaders)) {
    return
  }

  setCredentialHeaders(authHeaders)

  publisherInfo.send()
}

const handleOnUpdatedTab = (changeInfo: any) => {
  if (!changeInfo || !changeInfo.url) {
    return
  }

  publisherInfo.send()
}

const initScript = () => {
  // Don't run in incognito context
  if (chrome.extension.inIncognitoContext) {
    return
  }

  createPort()

  // Send publisher info on visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      publisherInfo.send()
    }
  })

  webRequestHandlers.registerOnSendHeadersWebRequest(handleOnSendHeadersWebRequest)
  tabHandlers.registerOnUpdatedTab(handleOnUpdatedTab)

  console.info('Greaselion script loaded: twitterBase.ts')
}

initScript()
