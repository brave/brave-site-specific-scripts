/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { port } from './messaging'

import * as types from './types'

const mediaDurationUrlPattern = 'https://www.youtube.com/api/stats/watchtime?*'

let registeredOnCompletedWebRequestHandler = false

export const registerOnCompletedWebRequestHandler = (callback: (mediaType: string, details: any) => void) => {
  if (registeredOnCompletedWebRequestHandler) {
    return
  }

  registeredOnCompletedWebRequestHandler = true

  if (!port) {
    return
  }

  port.postMessage({
    type: 'RegisterOnCompletedWebRequest',
    mediaType: types.mediaType,
    data: {
      urlPatterns: [ mediaDurationUrlPattern ]
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
