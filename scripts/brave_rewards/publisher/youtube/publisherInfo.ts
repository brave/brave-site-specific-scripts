/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getPort } from '../common/messaging'

import * as commonUtils from '../common/utils'

import * as types from './types'
import * as utils from './utils'

const getPublisherInfoForChannel = async (channelId: string) => {
  if (!channelId) {
    throw new Error('Invalid channel id')
  }

  const channelNameElement = utils.getChannelNameElementFromChannelPage()
  if (!channelNameElement) {
    throw new Error('Unable to extract channel name from page')
  }

  const publisherKey = commonUtils.buildPublisherKey(types.mediaType, channelId)
  const publisherName = utils.getChannelNameFromElement(channelNameElement)
  if (!publisherName) {
    throw new Error('Invalid publisher name')
  }

  // This media key represents the channel trailer video
  const mediaIdAnchor = utils.getMediaIdAnchorFromChannelPage()
  const mediaId = utils.getMediaIdFromAnchor(mediaIdAnchor)
  const mediaKey =
    commonUtils.buildMediaKey(types.mediaType, mediaId ? mediaId : channelId)

  const publisherUrl = utils.buildChannelUrl(channelId)
  const favIconUrl = utils.getFavIconUrlFromPage(document.scripts)

  return {
    url: publisherUrl,
    publisherKey,
    publisherName,
    mediaKey,
    favIconUrl
  }
}

const getPublisherInfoForUser = async () => {
  const url = location.href

  const response = await fetch(url)
  if (!response.ok) {
    const msg =
      commonUtils.formatNetworkError('Publisher request failed', response)
    throw new Error(msg)
  }

  const responseText = await response.text()

  const channelId = utils.getChannelIdFromResponse(responseText)
  if (!channelId) {
    throw new Error('Invalid channel id')
  }

  const publisherKey = commonUtils.buildPublisherKey(types.mediaType, channelId)
  const publisherName = utils.getChannelNameFromResponse(responseText)
  if (!publisherName) {
    throw new Error('Invalid publisher name')
  }

  // This media key represents the channel trailer video
  const mediaIdAnchor = utils.getMediaIdAnchorFromChannelPage()
  const mediaId = utils.getMediaIdFromAnchor(mediaIdAnchor)
  const mediaKey =
    commonUtils.buildMediaKey(types.mediaType, mediaId ? mediaId : channelId)

  const favIconUrl = utils.getFavIconUrlFromResponse(responseText)
  const publisherUrl = utils.buildChannelUrl(channelId)

  return {
    url: publisherUrl,
    publisherKey,
    publisherName,
    mediaKey,
    favIconUrl
  }
}

const getPublisherInfoForVideo = async () => {
  const url = location.href

  const mediaId = utils.getMediaIdFromUrl(new URL(url))
  if (!mediaId) {
    throw new Error('Invalid media id')
  }

  const videoUrl = utils.buildVideoUrl(mediaId)
  const encodedVideoUrl = encodeURI(videoUrl)

  const response = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodedVideoUrl}`)
  if (!response.ok) {
    if (response.status === 401) {
      // Embedding disabled; need to scrape data from page instead
      return scrapePublisherInfoFromPage(url)
    } else {
      const msg =
        commonUtils.formatNetworkError('oEmbed request failed', response)
      throw new Error(msg)
    }
  }

  const responseJson = await response.json()

  const fetchData: any = {}
  fetchData.publisherUrl = responseJson.author_url
  fetchData.publisherName = responseJson.author_name

  const publisherResponse = await fetch(fetchData.publisherUrl)
  if (!publisherResponse.ok) {
    const msg =
      commonUtils.formatNetworkError('Publisher request failed', response)
    throw new Error(msg)
  }

  const publisherResponseText = await publisherResponse.text()
  if (!publisherResponseText) {
    throw new Error('Publisher request failed: empty response')
  }

  return getPublisherInfoFromResponse(
    url,
    publisherResponseText,
    fetchData.publisherName,
    fetchData.publisherUrl)
}

const getPublisherInfoForExcluded = () => {
  return {
    url: `https://www.${types.mediaDomain}`,
    publisherKey: types.mediaDomain,
    publisherName: types.mediaDomain,
    mediaKey: '',
    favIconUrl: ''
  }
}

const getPublisherInfoFromResponse = (
  url: string,
  responseText: string,
  publisherName: string,
  publisherUrl: string
) => {
  const channelId = utils.getChannelIdFromResponse(responseText)
  if (!channelId) {
    throw new Error('Invalid channel id')
  }

  const publisherKey = commonUtils.buildPublisherKey(types.mediaType, channelId)

  const mediaId = utils.getMediaIdFromUrl(new URL(url))
  if (!mediaId) {
    throw new Error('Invalid media id')
  }

  const mediaKey =
    commonUtils.buildMediaKey(types.mediaType, mediaId ? mediaId : channelId)

  if (!publisherName) {
    publisherName = utils.getPublisherNameFromResponse(responseText)
    if (!publisherName) {
      throw new Error('Invalid publisher name')
    }
  }

  if (!publisherUrl) {
    publisherUrl = utils.buildChannelUrl(channelId)
  }

  const favIconUrl = utils.getFavIconUrlFromResponse(responseText)

  return {
    url: publisherUrl,
    publisherKey,
    publisherName,
    mediaKey,
    favIconUrl
  }
}

const scrapePublisherInfoFromPage = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const msg =
      commonUtils.formatNetworkError('Publisher request failed', response)
    throw new Error(msg)
  }

  const responseText = await response.text()
  if (!responseText) {
    throw new Error('Publisher request failed: empty response')
  }

  return getPublisherInfoFromResponse(url, responseText, '', '')
}

export const send = () => {
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

export const get = async () => {
  if (utils.isVideoPath(location.pathname)) {
    return getPublisherInfoForVideo()
  }

  if (utils.isChannelPath(location.pathname)) {
    const channelId = utils.getChannelIdFromUrl(location.pathname)
    return getPublisherInfoForChannel(channelId)
  }

  if (utils.isUserPath(location.pathname)) {
    return getPublisherInfoForUser()
  }

  if (utils.isExcludedPath(location.pathname)) {
    return getPublisherInfoForExcluded()
  }

  // Otherwise, it's a custom url which is handled just like a user url
  return getPublisherInfoForUser()
}
