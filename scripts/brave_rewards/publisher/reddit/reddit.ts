/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createPort, port } from './messaging'

import * as publisherInfo from './publisherInfo'
import * as tipping from './tipping'
import * as types from './types'

let registeredOnUpdatedTab = false

let lastLocation = ''

const handleOnUpdatedTab = (changeInfo: any) => {
  // When sites use the history API, it can cause spurious
  // tabs.onUpdated notifications. In order to work around that, look
  // for a changeInfo with a URL or a status of complete and then
  // store the location if it doesn't match.
  if (!changeInfo || (!changeInfo.url && changeInfo.status !== 'complete')) {
    return
  }

  if (location.href !== lastLocation) {
    lastLocation = location.href
    publisherInfo.send()
    tipping.configure()
  }
}

const registerOnUpdatedTab = () => {
  if (registeredOnUpdatedTab) {
    return
  }

  registeredOnUpdatedTab = true

  if (!port) {
    return
  }

  port.postMessage({
    type: 'RegisterOnUpdatedTab',
    mediaType: types.mediaType
  })

  port.onMessage.addListener(function (msg) {
    if (!msg.data) {
      return
    }
    switch (msg.type) {
      case 'OnUpdatedTab': {
        handleOnUpdatedTab(msg.data.changeInfo)
        break
      }
    }
  })
}

const initScript = () => {
  // Don't run in incognito context
  if (chrome.extension.inIncognitoContext) {
    return
  }

  createPort()

  // Send publisher info and configure tip action on visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      publisherInfo.send()
      tipping.configure()
    }
  })

  registerOnUpdatedTab()

  console.info('Greaselion script loaded: reddit.ts')
}

initScript()
