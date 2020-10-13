/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { port } from './messaging'

import * as types from './types'

const sendHeadersUrls = [ 'https://api.twitter.com/1.1/*' ]
const sendHeadersExtra = [ 'requestHeaders', 'extraHeaders' ]

let registeredOnSendHeadersWebRequest = false

export const registerOnSendHeadersWebRequest = (callback: (mediaType: string, details: any) => void) => {
  if (registeredOnSendHeadersWebRequest) {
    return
  }

  registeredOnSendHeadersWebRequest = true

  if (!port) {
    return
  }

  port.postMessage({
    type: 'RegisterOnSendHeadersWebRequest',
    mediaType: types.mediaType,
    data: {
      urlPatterns: sendHeadersUrls,
      extra: sendHeadersExtra
    }
  })

  port.onMessage.addListener(function (msg: any) {
    if (!msg.data) {
      return
    }
    switch (msg.type) {
      case 'OnSendHeadersWebRequest': {
        callback(msg.mediaType, msg.data.details)
        break
      }
    }
  })
}
