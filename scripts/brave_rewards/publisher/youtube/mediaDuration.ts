/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getPort } from '../common/messaging'

import * as commonUtils from '../common/utils'

import * as types from './types'
import * as utils from './utils'

let firstVisit = true

export const setFirstVisit = (enabled: boolean) => {
  firstVisit = enabled
}

export const sendMetadataFromUrl = (url: URL) => {
  const searchParams = new URLSearchParams(url.search)

  const mediaId = utils.getMediaIdFromParts(searchParams)
  const mediaKey = commonUtils.buildMediaKey(types.mediaType, mediaId)
  const duration = utils.getMediaDurationFromParts(searchParams)

  const port = getPort()
  if (!port) {
    return
  }

  port.postMessage({
    type: 'MediaDurationMetadata',
    mediaType: types.mediaType,
    data: {
      mediaKey,
      duration,
      firstVisit
    }
  })

  setFirstVisit(false)
}
