/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getPort } from '../common/messaging'
import {HeadersHandlerMessageEvent, RegisterHeadersHandlerEvent} from '../common/XHREvents'

let registeredOnCompletedWebRequestHandler = false

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
      urlPatterns: [urlPattern]
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


export const registerHeadersHandler = (
  urlPattern: string | undefined,
  callback: (headers: any) => void
) => {
  HeadersHandlerMessageEvent.subscribe((e) => callback(e.headers))
  console.log('send RegisterHeadersHandlerEvent')
  dispatchEvent(RegisterHeadersHandlerEvent.makeEvent({urlPattern}))
}
