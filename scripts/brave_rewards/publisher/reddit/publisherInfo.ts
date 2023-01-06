/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MediaMetaData } from '../common/types'
import { getPort, sendErrorResponse } from '../common/messaging'

import * as commonUtils from '../common/utils'

import * as types from './types'
import * as utils from './utils'

const getMediaMetaData = async (screenName: string, isOldReddit: boolean) => {
  if (!screenName) {
    throw new Error('Invalid parameters')
  }

  const data = await utils.getProfileData(screenName, isOldReddit)
  return {
    user: {
      id: data.id,
      screenName: screenName,
      fullName: data.name,
      favIconUrl: data.icon_img
    },
    post: {
      id: '',
      timestamp: '',
      text: ''
    }
  }
}

const sendForStandardPage = (url: URL) => {
  const screenName = utils.getScreenNameFromUrl(url)
  if (!screenName) {
    sendErrorResponse(types.mediaType, 'Invalid screen name')
    return
  }

  const isOldReddit = utils.isOldRedditUrl(url)

  return getMediaMetaData(screenName, isOldReddit)
    .then((mediaMetaData: MediaMetaData) => {
      const userId = mediaMetaData.user.id
      const publisherKey =
        commonUtils.buildPublisherKey(types.mediaType, userId)
      const publisherName = mediaMetaData.user.fullName
      if (!publisherName) {
        sendErrorResponse(types.mediaType, 'Invalid publisher name')
        return
      }

      const mediaKey = commonUtils.buildMediaKey(types.mediaType, screenName)
      const favIconUrl = mediaMetaData.user.favIconUrl

      // Regardless of this being old or new reddit we want to
      // canonicalize the url as https://reddit.com/ on the server,
      // so pass false here
      const profileUrl = utils.buildProfileUrl(screenName, false)

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

const sendForExcludedPage = () => {
  const url = `https://www.${types.mediaDomain}`
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

export const send = () => {
  const url = new URL(location.href)
  if (utils.isExcludedPath(url.pathname)) {
    sendForExcludedPage()
  } else {
    sendForStandardPage(url)
  }
}
