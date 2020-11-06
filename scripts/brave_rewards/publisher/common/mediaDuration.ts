/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getPort } from '../common/messaging'

import * as utils from '../common/utils'

export const sendMetadata = (
  mediaType: string,
  mediaId: string,
  duration: number,
  firstVisit: boolean) => {
  if (!mediaType || !mediaId) {
    return
  }

  const port = getPort()
  if (!port) {
    return
  }

  port.postMessage({
    type: 'MediaDurationMetadata',
    mediaType,
    data: {
      mediaKey: utils.buildMediaKey(mediaType, mediaId),
      duration,
      firstVisit
    }
  })
}
