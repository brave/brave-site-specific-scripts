/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { port } from '../common/messaging'

import * as types from './types'
import * as utils from './utils'

const getPublisherData = async () => {
  if (utils.isVideoPath(location.pathname)) {
    return getPublisherDataFromVideoPage()
  } else {
    return getPublisherDataFromUnrecognizedPage()
  }
}

const getPublisherDataFromVideoPage = async () => {
  const url = location.href
  const encodedVideoUrl = encodeURI(url)

  const oembedResponse = await fetch(`https://vimeo.com/api/oembed.json?url=${encodedVideoUrl}`)
  if (!oembedResponse.ok) {
    return getPublisherDataFromUnrecognizedPage()
  }

  const data = await oembedResponse.json()
  if (!data) {
    return getPublisherDataFromUnrecognizedPage()
  }

  const publisherUrl = data.author_url
  if (!publisherUrl) {
    return getPublisherDataFromUnrecognizedPage()
  }

  const publisherName = data.author_name
  if (!publisherName) {
    throw new Error('Invalid publisher name')
  }

  const videoId = data.video_id
  if (!videoId || videoId === 0) {
    return getPublisherDataFromUnrecognizedPage()
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

  const publisherKey = utils.buildPublisherKey(userId)

  const mediaKey = utils.buildMediaKey(videoId)
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

const getPublisherDataFromUnrecognizedPage = async () => {
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

    mediaKey = utils.buildMediaKey(videoId)
  }

  const publisherKey = utils.buildPublisherKey(userId)

  return {
    url,
    publisherKey,
    publisherName,
    mediaKey,
    favIconUrl: ''
  }
}

const sendForStandardPage = () => {
  getPublisherData()
    .then((publisherData) => {
      if (!port) {
        throw new Error('Invalid port')
      }
      port.postMessage({
        type: 'SavePublisherVisit',
        mediaType: types.mediaType,
        data: {
          url: publisherData.url,
          publisherKey: publisherData.publisherKey,
          publisherName: publisherData.publisherName,
          mediaKey: publisherData.mediaKey,
          favIconUrl: publisherData.favIconUrl
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
