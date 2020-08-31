/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as ytUtils from './utils'

const braveRewardsExtensionId = 'jidkidbbcafjabdphckchenhfomhnfma'

const mediaType = 'youtube'
const mediaDurationUrlRegex = 'https://www.youtube.com/api/stats/watchtime?*'

let port: chrome.runtime.Port | null = null

let registeredMediaDurationHandler = false

const sendErrorResponse = (errorMessage: string) => {
  chrome.runtime.sendMessage(
    braveRewardsExtensionId, {
      type: 'GreaselionError',
      mediaType: mediaType,
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

  const publisherKey = ytUtils.buildPublisherKey(channelId)
  const publisherName = ytUtils.getChannelNameFromChannelPage()
  const favIconUrl = ytUtils.getFavIconUrlFromPage()

  // This media key represents the channel trailer video
  let mediaKey = ''
  const mediaId = ytUtils.getMediaIdFromChannelPage()
  if (mediaId) {
    mediaKey = ytUtils.buildMediaKey(mediaId)
  }

  const url = new URL(location.href)
  if (!url) {
    return
  }

  url.pathname = url.pathname + '/videos'

  chrome.runtime.sendMessage(
    braveRewardsExtensionId, {
      type: 'SavePublisherVisit',
      mediaType: mediaType,
      data: {
        url: url.href,
        publisherKey,
        publisherName,
        mediaKey,
        favIconUrl
      }
    })
}

const sendPublisherInfoForUser = () => {
  const channelId = ytUtils.getChannelIdFromChannelPage()
  if (!channelId) {
    sendErrorResponse('Unable to scrape channel id')
    return
  }

  const user = ytUtils.getUserFromUrl(location.pathname)
  if (!user) {
    sendErrorResponse('Unable to extract user from url')
    return
  }

  const publisherKey = ytUtils.buildPublisherKey(channelId)
  const publisherName = ytUtils.getChannelNameFromChannelPage()

  // This media key represents the channel trailer video
  let mediaKey = ''
  const mediaId = ytUtils.getMediaIdFromChannelPage()
  if (mediaId) {
    mediaKey = ytUtils.buildMediaKey(mediaId)
  }

  const publisherUrl = ytUtils.buildChannelUrl(channelId)

  chrome.runtime.sendMessage(
    braveRewardsExtensionId, {
      type: 'SavePublisherVisit',
      mediaType: mediaType,
      data: {
        url: publisherUrl,
        publisherKey,
        publisherName,
        mediaKey
      }
    })
}

const sendPublisherInfoForVideoHelper = (url: string, responseText: string, publisherName: string, publisherUrl: string) => {
  const favIconUrl = ytUtils.getFavIconUrlFromResponse(responseText)
  const channelId = ytUtils.getChannelIdFromResponse(responseText)
  const publisherKey = ytUtils.buildPublisherKey(channelId)

  const mediaId = ytUtils.getMediaIdFromUrl(new URL(url))
  if (!mediaId) {
    return
  }

  const mediaKey = ytUtils.buildMediaKey(mediaId)

  if (!publisherName) {
    publisherName = ytUtils.getPublisherNameFromResponse(responseText)
  }

  if (!publisherUrl) {
    publisherUrl = ytUtils.buildChannelUrl(channelId)
  }

  chrome.runtime.sendMessage(
    braveRewardsExtensionId, {
      type: 'SavePublisherVisit',
      mediaType: mediaType,
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

  const mediaId = ytUtils.getMediaIdFromUrl(new URL(url))
  if (!mediaId) {
    return
  }

  const videoUrl = ytUtils.buildVideoUrl(mediaId)
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

const maybeSendPublisherInfo = () => {
  if (ytUtils.isVideoPath(location.pathname)) {
    sendPublisherInfoForVideo()
  } else if (ytUtils.isChannelPath(location.pathname)) {
    const channelId = ytUtils.getChannelIdFromUrl(location.pathname)
    sendPublisherInfoForChannel(channelId)
  } else if (ytUtils.isUserPath(location.pathname)) {
    sendPublisherInfoForUser()
  } else if (!ytUtils.isPredefinedPath(location.pathname)) {
    const channelId = ytUtils.getChannelIdFromChannelPage()
    sendPublisherInfoForChannel(channelId)
  }
}

const sendMediaDurationMetadataResponse = (url: URL) => {
  const searchParams = new URLSearchParams(url.search)

  const mediaId = ytUtils.getMediaIdFromParts(searchParams)
  const mediaKey = ytUtils.buildMediaKey(mediaId)

  const duration = ytUtils.getMediaDurationFromParts(searchParams)

  if (!port) {
    return
  }

  port.postMessage({
    type: 'MediaDurationMetadataResponse',
    mediaType: mediaType,
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
    mediaType: mediaType,
    data: {
      urlRegex: mediaDurationUrlRegex
    }
  })

  port.onMessage.addListener(function (msg) {
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
        !ytUtils.isVideoPath(location.pathname)) {
      setTimeout(() => {
        registerMediaDurationHandler()
        maybeSendPublisherInfo()
      }, 200)
    }
  })

  // Load publisher info and register media duration handler on visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      registerMediaDurationHandler()
      maybeSendPublisherInfo()
    }
  })

  // Load publisher info and register media duartion handler on page data update
  // Note: Can't use 'yt-navigate-finish' for this, as data may not have
  // finished loading by then
  document.addEventListener('yt-page-data-updated', function () {
    if (document.visibilityState === 'visible') {
      registerMediaDurationHandler()
      maybeSendPublisherInfo()
    }
  })

  console.info('Greaselion script loaded: youtube.ts')
}

initScript()
