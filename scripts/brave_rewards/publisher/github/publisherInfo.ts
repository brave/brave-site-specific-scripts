/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getPort, sendErrorResponse } from '../common/messaging'
import { MediaMetaData } from '../common/types'

import * as types from './types'
import * as utils from './utils'

const sendForExcludedPage = () => {
  const url = `https://${types.mediaDomain}`
  const publisherKey = types.mediaDomain
  const publisherName = types.mediaDomain
  const mediaKey = ''
  const favIconUrl = ''

  const port = getPort()
  if (!port) {
    return
  }

  port.postMessage({
    type: 'SavePublisherVisit',
    mediaType: '',
    data: {
      url,
      publisherKey,
      publisherName,
      mediaKey,
      favIconUrl
    }
  })
}

const sendForStandardPage = (url: URL) => {
  const screenName = utils.getScreenNameFromUrl(url)
  if (!screenName) {
    sendErrorResponse(types.mediaType, 'Invalid screen name')
    return
  }

  return utils.getMediaMetaData(screenName)
    .then((mediaMetaData: MediaMetaData) => {
      const userId = mediaMetaData.user.id
      const publisherKey = utils.buildPublisherKey(userId)
      const publisherName = mediaMetaData.user.fullName
      if (!publisherName) {
        sendErrorResponse(types.mediaType, 'Invalid publisher name')
        return
      }

      const mediaKey = ''
      const favIconUrl = mediaMetaData.user.favIconUrl

      const profileUrl = utils.buildProfileUrl(screenName)

      const port = getPort()
      if (!port) {
        return
      }

      port.postMessage({
        type: 'SavePublisherVisit',
        mediaType: types.mediaType,
        data: {
          url: profileUrl,
          publisherKey,
          publisherName,
          mediaKey,
          favIconUrl
        }
      })
    })
}

export const send = () => {
  const url = new URL(location.href)
  if (utils.isExcludedPath(url.pathname)) {
    sendForExcludedPage()
  } else {
    sendForStandardPage(url)
  }
}
