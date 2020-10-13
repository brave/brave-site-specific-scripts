/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { port } from './messaging'

import * as types from './types'

let registeredOnUpdatedTab = false

export const registerOnUpdatedTab = (callback: (changeInfo: any) => void) => {
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
