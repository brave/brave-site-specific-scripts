/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getPort, createPort, sendErrorResponse } from '../common/messaging'
import * as tabHandlers from '../common/tabHandlers'
import { documentReady } from '../common/utils'

import * as types from './types'
import { PublisherInfoReader } from './utils'

const publisherInfoReader = new PublisherInfoReader()
let lastLocation = ''

const handleOnUpdatedTab = (changeInfo: any): void => {
  if (!changeInfo || changeInfo.status !== 'complete') {
    return
  }

  if (location.href !== lastLocation) {
    lastLocation = location.href
    sendPublisherInfo()
  }
}

const sendPublisherInfo = () => {
  publisherInfoReader.read().then((info) => {
    const port = getPort()
    if (!port) {
      return
    }

    port.postMessage({
      type: 'SavePublisherVisit',
      mediaType: info.mediaId ? types.mediaType : '',
      data: {
        url: info.publisherUrl,
        publisherKey: info.publisherKey,
        publisherName: info.publisherName,
        mediaKey: info.mediaKey,
        favIconUrl: info.favIconUrl
      }
    })
  }).catch((err: any) => {
    const msg = err ? err.message : ''
    sendErrorResponse(types.mediaType, `Error reading publisher info: ${msg})`)
  })
}

const initScript = () => {
  if (chrome.extension.inIncognitoContext) {
    return
  }

  createPort((success) => {
    if (!success) {
      console.error('Failed to initialize communications port')
      return
    }

    tabHandlers.registerOnUpdatedTab(types.mediaType, handleOnUpdatedTab)

    if (documentReady()) {
      sendPublisherInfo()
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        sendPublisherInfo()
      }
    })

    console.info('Greaselion script loaded: twitchBase.ts')
  })
}

initScript()
