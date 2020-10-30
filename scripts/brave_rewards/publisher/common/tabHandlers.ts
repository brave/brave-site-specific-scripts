/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getPort } from '../common/messaging'

let registeredOnUpdatedTab = false

export const registerOnUpdatedTab = (mediaType: string, callback: (changeInfo: any) => void) => {
  if (!mediaType || registeredOnUpdatedTab) {
    return
  }

  registeredOnUpdatedTab = true

  const port = getPort()
  if (!port) {
    return
  }

  port.postMessage({
    type: 'RegisterOnUpdatedTab',
    mediaType: mediaType
  })

  port.onMessage.addListener(function (msg: any) {
    if (!msg.data) {
      return
    }
    switch (msg.type) {
      case 'OnUpdatedTab': {
        callback(msg.data.changeInfo)
        break
      }
    }
  })
}
