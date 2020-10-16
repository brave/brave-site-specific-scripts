/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as commonTypes from '../common/types'
import * as types from './types'

export let port: chrome.runtime.Port | null = null

export const createPort = () => {
  if (port) {
    return
  }

  port = chrome.runtime.connect(commonTypes.braveRewardsExtensionId, { name: 'Greaselion' })
}

export const sendErrorResponse = (errorMessage: string) => {
  if (!port) {
    return
  }

  port.postMessage({
    type: 'GreaselionError',
    mediaType: types.mediaType,
    data: {
      errorMessage
    }
  })
}
