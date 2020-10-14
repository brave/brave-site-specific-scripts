/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { port, sendErrorResponse } from './messaging'

import * as types from './types'
import * as utils from './utils'

const sendForChannel = (channelId: string) => {
  if (!channelId) {
    sendErrorResponse('Invalid channel id')
    return
  }

  const channelNameElement = utils.getChannelNameElementFromChannelPage()
  if (!channelNameElement) {
    sendErrorResponse('Unable to extract channel name from page')
    return
  }

  const publisherKey = utils.buildPublisherKey(channelId)
  const publisherName = utils.getChannelNameFromElement(channelNameElement)
  if (!publisherName) {
    sendErrorResponse('Invalid publisher name')
    return
  }

  // This media key represents the channel trailer video
  let mediaKey = ''
  const mediaIdAnchor = utils.getMediaIdAnchorFromChannelPage()
  const mediaId = utils.getMediaIdFromAnchor(mediaIdAnchor)
  if (mediaId) {
    mediaKey = utils.buildMediaKey(mediaId)
  }

  const publisherUrl = utils.buildChannelUrl(channelId)
  const favIconUrl = utils.getFavIconUrlFromPage(document.scripts)

  if (!port) {
    return
  }

  port.postMessage({
    type: 'SavePublisherVisit',
    mediaType: types.mediaType,
    data: {
      url: publisherUrl,
      publisherKey,
      publisherName,
      mediaKey,
      favIconUrl
    }
  })
}

const sendForExcluded = () => {
  const url = `https://www.${types.mediaDomain}`
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

const sendForUser = () => {
  const url = location.href

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`YouTube publisher request failed: ${response.statusText} (${response.status})`)
      }
      return response.text()
    })
    .then((responseText) => {
      const channelId = utils.getChannelIdFromResponse(responseText)
      if (!channelId) {
        sendErrorResponse('Invalid channel id')
        return
      }

      const publisherKey = utils.buildPublisherKey(channelId)
      const publisherName = utils.getChannelNameFromResponse(responseText)
      if (!publisherName) {
        sendErrorResponse('Invalid publisher name')
        return
      }

      // This media key represents the channel trailer video
      let mediaKey = ''
      const mediaIdAnchor = utils.getMediaIdAnchorFromChannelPage()
      const mediaId = utils.getMediaIdFromAnchor(mediaIdAnchor)
      if (mediaId) {
        mediaKey = utils.buildMediaKey(mediaId)
      }

      const favIconUrl = utils.getFavIconUrlFromResponse(responseText)
      const publisherUrl = utils.buildChannelUrl(channelId)

      if (!port) {
        return
      }

      port.postMessage({
        type: 'SavePublisherVisit',
        mediaType: types.mediaType,
        data: {
          url: publisherUrl,
          publisherKey,
          publisherName,
          mediaKey,
          favIconUrl
        }
      })
    })
    .catch((error) => {
      throw new Error(`YouTube fetch request failed: ${error}`)
    })
}

const sendForVideoHelper = (url: string, responseText: string, publisherName: string, publisherUrl: string) => {
  const channelId = utils.getChannelIdFromResponse(responseText)
  if (!channelId) {
    sendErrorResponse('Invalid channel id')
    return
  }

  const publisherKey = utils.buildPublisherKey(channelId)

  const mediaId = utils.getMediaIdFromUrl(new URL(url))
  if (!mediaId) {
    sendErrorResponse('Invalid media id')
    return
  }

  const mediaKey = utils.buildMediaKey(mediaId)

  if (!publisherName) {
    publisherName = utils.getPublisherNameFromResponse(responseText)
    if (!publisherName) {
      sendErrorResponse('Invalid publisher name')
      return
    }
  }

  if (!publisherUrl) {
    publisherUrl = utils.buildChannelUrl(channelId)
  }

  const favIconUrl = utils.getFavIconUrlFromResponse(responseText)

  if (!port) {
    return
  }

  port.postMessage({
    type: 'SavePublisherVisit',
    mediaType: types.mediaType,
    data: {
      url: publisherUrl,
      publisherKey,
      publisherName,
      mediaKey,
      favIconUrl
    }
  })
}

const scrapePublisherInfoFromPage = (url: string) => {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`YouTube publisher request failed: ${response.statusText} (${response.status})`)
      }
      return response.text()
    })
    .then((responseText) => {
      sendForVideoHelper(url, responseText, '', '')
    })
    .catch((error) => {
      throw new Error(`YouTube fetch request failed: ${error}`)
    })
}

const sendForVideo = () => {
  const url = location.href

  const mediaId = utils.getMediaIdFromUrl(new URL(url))
  if (!mediaId) {
    sendErrorResponse('Invalid media id')
    return
  }

  const videoUrl = utils.buildVideoUrl(mediaId)
  const encodedVideoUrl = encodeURI(videoUrl)

  const fetchData: any = {}

  fetch(`https://www.youtube.com/oembed?format=json&url=${encodedVideoUrl}`)
    .then((response) => {
      if (!response.ok) {
        if (response.status === 401) {
          // Embedding disabled; need to scrape data from page instead
          scrapePublisherInfoFromPage(url)
        } else {
          throw new Error(`YouTube oembed request failed: ${response.statusText} (${response.status})`)
        }
      }
      return response.json()
    })
    .then((responseJson) => {
      fetchData.publisherUrl = responseJson.author_url
      fetchData.publisherName = responseJson.author_name
      return fetch(fetchData.publisherUrl)
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`YouTube publisher request failed: ${response.statusText} (${response.status})`)
      }
      return response.text()
    })
    .then((responseText) => {
      sendForVideoHelper(
        url,
        responseText,
        fetchData.publisherName,
        fetchData.publisherUrl)
    })
    .catch((error) => {
      throw new Error(`YouTube fetch request failed: ${error}`)
    })
}

export const send = () => {
  if (utils.isVideoPath(location.pathname)) {
    sendForVideo()
    return
  }

  if (utils.isChannelPath(location.pathname)) {
    sendForChannel(utils.getChannelIdFromUrl(location.pathname))
    return
  }

  if (utils.isUserPath(location.pathname)) {
    sendForUser()
    return
  }

  if (utils.isExcludedPath(location.pathname)) {
    sendForExcluded()
    return
  }

  // Otherwise, it's a custom url which is handled just like a user url
  sendForUser()
}
