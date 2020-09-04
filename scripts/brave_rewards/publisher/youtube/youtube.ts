/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as types from './types'
import * as utils from './utils'

const braveRewardsExtensionId = 'jidkidbbcafjabdphckchenhfomhnfma'

const mediaDurationUrlRegex = 'https://www.youtube.com/api/stats/watchtime?*'

let port: chrome.runtime.Port | null = null

let registeredMediaDurationHandler = false

const sendErrorResponse = (errorMessage: string) => {
  chrome.runtime.sendMessage(
    braveRewardsExtensionId, {
      type: 'GreaselionError',
      mediaType: types.mediaType,
      data: {
        errorMessage
      }
    })
}

const sendPublisherInfoForChannel = (channelId: string) => {
  if (!channelId) {
    sendErrorResponse('Invalid channel id')
    return
  }

  const publisherKey = utils.buildPublisherKey(channelId)
  const publisherName = utils.getChannelNameFromChannelPage()
  const favIconUrl = utils.getFavIconUrlFromPage()

  // This media key represents the channel trailer video
  let mediaKey = ''
  const mediaId = utils.getMediaIdFromChannelPage()
  if (mediaId) {
    mediaKey = utils.buildMediaKey(mediaId)
  }

  const url = new URL(location.href)
  if (!url) {
    return
  }

  url.pathname = url.pathname + '/videos'

  chrome.runtime.sendMessage(
    braveRewardsExtensionId, {
      type: 'SavePublisherVisit',
      mediaType: types.mediaType,
      data: {
        url: url.href,
        publisherKey,
        publisherName,
        mediaKey,
        favIconUrl
      }
    })
}

const sendPublisherInfoForPredefined = () => {
  const url = `https://${types.mediaDomain}`
  const publisherKey = types.mediaDomain
  const publisherName = types.mediaType
  const favIconUrl = ''

  chrome.runtime.sendMessage(
    braveRewardsExtensionId, {
      type: 'SavePublisherVisit',
      mediaType: types.mediaType,
      data: {
        url: url,
        publisherKey,
        publisherName,
        favIconUrl
      }
    })
}

const sendPublisherInfoForUser = () => {
  const channelId = utils.getChannelIdFromChannelPage()
  if (!channelId) {
    sendErrorResponse('Unable to scrape channel id')
    return
  }

  const user = utils.getUserFromUrl(location.pathname)
  if (!user) {
    sendErrorResponse('Unable to extract user from url')
    return
  }

  const publisherKey = utils.buildPublisherKey(channelId)
  const publisherName = utils.getChannelNameFromChannelPage()

  // This media key represents the channel trailer video
  let mediaKey = ''
  const mediaId = utils.getMediaIdFromChannelPage()
  if (mediaId) {
    mediaKey = utils.buildMediaKey(mediaId)
  }

  const publisherUrl = utils.buildChannelUrl(channelId)

  chrome.runtime.sendMessage(
    braveRewardsExtensionId, {
      type: 'SavePublisherVisit',
      mediaType: types.mediaType,
      data: {
        url: publisherUrl,
        publisherKey,
        publisherName,
        mediaKey
      }
    })
}

const sendPublisherInfoForVideoHelper = (url: string, responseText: string, publisherName: string, publisherUrl: string) => {
  const favIconUrl = utils.getFavIconUrlFromResponse(responseText)
  const channelId = utils.getChannelIdFromResponse(responseText)
  const publisherKey = utils.buildPublisherKey(channelId)

  const mediaId = utils.getMediaIdFromUrl(new URL(url))
  if (!mediaId) {
    return
  }

  const mediaKey = utils.buildMediaKey(mediaId)

  if (!publisherName) {
    publisherName = utils.getPublisherNameFromResponse(responseText)
  }

  if (!publisherUrl) {
    publisherUrl = utils.buildChannelUrl(channelId)
  }

  chrome.runtime.sendMessage(
    braveRewardsExtensionId, {
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
      sendPublisherInfoForVideoHelper(url, responseText, '', '')
    })
    .catch((error) => {
      throw new Error(`YouTube fetch request failed: ${error}`)
    })
}

const sendPublisherInfoForVideo = () => {
  const url = location.href

  const mediaId = utils.getMediaIdFromUrl(new URL(url))
  if (!mediaId) {
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
      sendPublisherInfoForVideoHelper(
        url,
        responseText,
        fetchData.publisherName,
        fetchData.publisherUrl)
    })
    .catch((error) => {
      throw new Error(`YouTube fetch request failed: ${error}`)
    })
}

const sendPublisherInfo = () => {
  if (utils.isVideoPath(location.pathname)) {
    sendPublisherInfoForVideo()
  } else if (utils.isChannelPath(location.pathname)) {
    const channelId = utils.getChannelIdFromUrl(location.pathname)
    sendPublisherInfoForChannel(channelId)
  } else if (utils.isUserPath(location.pathname)) {
    sendPublisherInfoForUser()
  } else if (utils.isPredefinedPath(location.pathname)) {
    sendPublisherInfoForPredefined()
  } else {
    const channelId = utils.getChannelIdFromChannelPage()
    sendPublisherInfoForChannel(channelId)
  }
}

const sendMediaDurationMetadataResponse = (url: URL) => {
  const searchParams = new URLSearchParams(url.search)

  const mediaId = utils.getMediaIdFromParts(searchParams)
  const mediaKey = utils.buildMediaKey(mediaId)

  const duration = utils.getMediaDurationFromParts(searchParams)

  if (!port) {
    return
  }

  port.postMessage({
    type: 'MediaDurationMetadataResponse',
    mediaType: types.mediaType,
    data: {
      mediaKey,
      duration
    }
  })
}

// Register a media duration handler for this script
const registerMediaDurationHandler = () => {
  if (registeredMediaDurationHandler) {
    return
  }

  if (!port) {
    return
  }

  port.postMessage({
    type: 'MediaDurationHandlerRegistrationRequest',
    mediaType: types.mediaType,
    data: {
      urlRegex: mediaDurationUrlRegex
    }
  })

  port.onMessage.addListener((msg) => {
    switch (msg.type) {
      case 'MediaDurationMetadataRequest': {
        const url = new URL(msg.url)
        sendMediaDurationMetadataResponse(url)
        break
      }
    }
  })
}

const initScript = () => {
  // Don't run in incognito context
  if (chrome.extension.inIncognitoContext) {
    return
  }

  port = chrome.runtime.connect(braveRewardsExtensionId, { name: 'Greaselion' })

  // Load publisher info and register media duration handler when document finishes loading
  // Note: Not needed for video paths, as 'yt-page-data-updated' handles those
  document.addEventListener('readystatechange', function () {
    if (document.readyState === 'complete' &&
        document.visibilityState === 'visible' &&
        !utils.isVideoPath(location.pathname)) {
      console.debug('readystatechange event triggered')
      setTimeout(() => {
        registerMediaDurationHandler()
        sendPublisherInfo()
      }, 200)
    }
  })

  // Load publisher info and register media duration handler on visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      registerMediaDurationHandler()
      sendPublisherInfo()
    }
  })

  // Load publisher info and register media duartion handler on page data update
  // Note: Can't use 'yt-navigate-finish' for this, as data may not have
  // finished loading by then
  document.addEventListener('yt-page-data-updated', function () {
    if (document.visibilityState === 'visible') {
      registerMediaDurationHandler()
      sendPublisherInfo()
    }
  })

  console.info('Greaselion script loaded: youtube.ts')
}

initScript()
