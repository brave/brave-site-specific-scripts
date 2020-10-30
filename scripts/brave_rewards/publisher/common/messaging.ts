/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as types from './types'

let port: chrome.runtime.Port | null = null

export const getPort = () => {
  return port
}

export const createPort = (callback: (success: boolean) => void) => {
  if (port) {
    callback(true)
    return
  }

  // The Rewards Greaselion API lives in the Brave extension now, but
  // previously it lived in the Rewards extension. To support
  // backwards compatibility with older browsers, send a special
  // message to the Brave extension. If we get the expected response,
  // then connect to the Brave extension. Otherwise, if we timeout
  // connect to the Rewards extension instead.
  chrome.runtime.sendMessage(
    types.braveExtensionId,
    { type: 'SupportsGreaselion' },
    function (response) {
      if (!chrome.runtime.lastError && response && response.supported) {
        port = chrome.runtime.connect(types.braveExtensionId, { name: 'Greaselion' })
        callback(true)
        return
      }
    })

  setTimeout(() => {
    if (!port) {
      port = chrome.runtime.connect(types.braveRewardsExtensionId, { name: 'Greaselion' })
      callback(true)
      return
    }
  }, 100)
}

export const sendErrorResponse = (mediaType: string, errorMessage: string) => {
  if (!mediaType || !port) {
    return
  }

  port.postMessage({
    type: 'GreaselionError',
    mediaType: mediaType,
    data: {
      errorMessage
    }
  })
}
