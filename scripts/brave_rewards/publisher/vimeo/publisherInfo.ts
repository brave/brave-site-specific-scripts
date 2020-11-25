/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getPort } from '../common/messaging'

import * as commonUtils from '../common/utils'

import * as types from './types'
import * as utils from './utils'

const getPublisherInfoForVideoPage = async () => {
  const url = location.href
  const encodedVideoUrl = encodeURI(url)

  const oembedResponse = await fetch(`https://vimeo.com/api/oembed.json?url=${encodedVideoUrl}`)
  if (!oembedResponse.ok) {
    return getPublisherInfoForUnrecognizedPage()
  }

  const data = await oembedResponse.json()
  if (!data) {
    return getPublisherInfoForUnrecognizedPage()
  }

  const publisherUrl = data.author_url
  if (!publisherUrl) {
    return getPublisherInfoForUnrecognizedPage()
  }

  const publisherName = data.author_name
  if (!publisherName) {
    throw new Error('Invalid publisher name')
  }

  const videoId = data.video_id
  if (!videoId || videoId === 0) {
    return getPublisherInfoForUnrecognizedPage()
  }

  const response = await fetch(publisherUrl)
  if (!response.ok) {
    throw new Error(`Publisher request failed: ${response.statusText} (${response.status})`)
  }

  const responseText = await response.text()

  const userId = utils.getUserIdFromPublisherPageResponse(responseText)
  if (!userId) {
    throw new Error('Invalid user id')
  }

  const publisherKey = commonUtils.buildPublisherKey(types.mediaType, userId)

  const mediaKey = commonUtils.buildMediaKey(types.mediaType, videoId.toString())
  if (!mediaKey) {
    throw new Error('Invalid media key')
  }

  const favIconUrl = utils.buildFavIconUrl(userId)

  return {
    url: publisherUrl,
    publisherKey,
    publisherName,
    mediaKey,
    favIconUrl
  }
}

const getPublisherInfoForUnrecognizedPage = async () => {
  const url = location.href
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Publisher request failed: ${response.statusText} (${response.status})`)
  }

  const responseText = await response.text()
  if (!responseText) {
    throw new Error('Publisher response empty')
  }

  // Determine whether this is a publisher page or a video page

  let publisherName = ''
  let mediaKey = ''

  let userId = utils.getUserIdFromPublisherPageResponse(responseText)
  if (userId) {
    publisherName = utils.getPublisherNameFromPublisherPageResponse(responseText)
    if (!publisherName) {
      throw new Error('Invalid publisher name')
    }
  } else {
    publisherName = utils.getPublisherNameFromVideoPageResponse(responseText)
    if (!publisherName) {
      throw new Error('Invalid publisher name')
    }

    userId = utils.getUserIdFromVideoPageResponse(responseText)
    if (!userId) {
      throw new Error('Invalid user id')
    }

    const videoId = utils.getVideoIdFromVideoPageResponse(responseText)
    if (!videoId) {
      throw new Error('Invalid video id')
    }
  }

  mediaKey = commonUtils.buildMediaKey(types.mediaType, userId)

  const publisherKey = commonUtils.buildPublisherKey(types.mediaType, userId)

  return {
    url,
    publisherKey,
    publisherName,
    mediaKey,
    favIconUrl: ''
  }
}

const sendForStandardPage = () => {
  get()
    .then((info) => {
      const port = getPort()
      if (!port) {
        throw new Error('Invalid port')
      }
      port.postMessage({
        type: 'SavePublisherVisit',
        mediaType: types.mediaType,
        data: {
          url: info.url,
          publisherKey: info.publisherKey,
          publisherName: info.publisherName,
          mediaKey: info.mediaKey,
          favIconUrl: info.favIconUrl
        }
      })
    })
    .catch((error) => {
      throw new Error(`Failed to retrieve publisher data: ${error}`)
    })
}

const sendForExcludedPage = () => {
  const url = `https://${types.mediaDomain}`
  const publisherKey = types.mediaDomain
  const publisherName = types.mediaDomain
  const favIconUrl = ''

  const port = getPort()
  if (!port) {
    return
  }

  port.postMessage({
    type: 'SavePublisherVisit',
    mediaType: '',
    data: {
      url: url,
      publisherKey,
      publisherName,
      favIconUrl
    }
  })
}

export const send = () => {
  const url = new URL(location.href)
  if (utils.isExcludedPath(url.pathname)) {
    sendForExcludedPage()
  } else {
    sendForStandardPage()
  }
}

export const get = async () => {
  if (utils.isVideoPath(location.pathname)) {
    return getPublisherInfoForVideoPage()
  } else {
    return getPublisherInfoForUnrecognizedPage()
  }
}
