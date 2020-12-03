/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getPort } from '../common/messaging'

let registeredOnCompletedWebRequestHandler = false
let registeredOnSendHeadersWebRequest = false

export const registerOnCompletedWebRequestHandler = (
  mediaType: string,
  urlPattern: string,
  callback: (mediaType: string, details: any) => void
) => {
  if (!mediaType || registeredOnCompletedWebRequestHandler) {
    return
  }

  registeredOnCompletedWebRequestHandler = true

  const port = getPort()
  if (!port) {
    return
  }

  port.postMessage({
    type: 'RegisterOnCompletedWebRequest',
    mediaType,
    data: {
      urlPatterns: [ urlPattern ]
    }
  })

  port.onMessage.addListener((msg: any) => {
    switch (msg.type) {
      case 'OnCompletedWebRequest': {
        callback(msg.mediaType, msg.details)
        break
      }
    }
  })
}

export const registerOnSendHeadersWebRequest = (
  mediaType: string,
  urlPatterns: string[],
  extra: string[],
  callback: (mediaType: string, details: any) => void
) => {
  if (!mediaType || registeredOnSendHeadersWebRequest) {
    return
  }

  registeredOnSendHeadersWebRequest = true

  const port = getPort()
  if (!port) {
    return
  }

  port.postMessage({
    type: 'RegisterOnSendHeadersWebRequest',
    mediaType,
    data: {
      urlPatterns,
      extra
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
