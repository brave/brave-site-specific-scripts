/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as types from './types'
import * as utils from './utils'

const braveRewardsExtensionId = 'jidkidbbcafjabdphckchenhfomhnfma'
const mediaDurationUrlPattern = 'https://www.youtube.com/api/stats/watchtime?*'

let port: chrome.runtime.Port | null = null

let registeredOnCompletedWebRequestHandler = false

let firstVisit = true

const sendErrorResponse = (errorMessage: string) => {
  if (!port) {
    return
  }

  port.postMessage({
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

  const channelNameElement = utils.getChannelNameElementFromChannelPage()
  if (!channelNameElement) {
    sendErrorResponse('Unable to extract channel name from page')
    return
  }

  const publisherKey = utils.buildPublisherKey(channelId)
  const publisherName = utils.getChannelNameFromElement(channelNameElement)
  const favIconUrl = utils.getFavIconUrlFromPage(document.scripts)

  // This media key represents the channel trailer video
  let mediaKey = ''
  const mediaIdAnchor = utils.getMediaIdAnchorFromChannelPage()
  const mediaId = utils.getMediaIdFromAnchor(mediaIdAnchor)
  if (mediaId) {
    mediaKey = utils.buildMediaKey(mediaId)
  }

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
}

const sendPublisherInfoForPredefined = () => {
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

const sendPublisherInfoForUser = () => {
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
        sendErrorResponse('Unable to scrape channel id')
        return
      }

      const publisherKey = utils.buildPublisherKey(channelId)
      const publisherName = utils.getChannelNameFromResponse(responseText)
      const favIconUrl = utils.getFavIconUrlFromResponse(responseText)

      // This media key represents the channel trailer video
      let mediaKey = ''
      const mediaIdAnchor = utils.getMediaIdAnchorFromChannelPage()
      const mediaId = utils.getMediaIdFromAnchor(mediaIdAnchor)
      if (mediaId) {
        mediaKey = utils.buildMediaKey(mediaId)
      }

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
    return
  }

  if (utils.isChannelPath(location.pathname)) {
    const channelId = utils.getChannelIdFromUrl(location.pathname)
    sendPublisherInfoForChannel(channelId)
    return
  }

  if (utils.isUserPath(location.pathname)) {
    sendPublisherInfoForUser()
    return
  }

  if (utils.isPredefinedPath(location.pathname)) {
    sendPublisherInfoForPredefined()
    return
  }

  const channelId = utils.getChannelIdFromChannelPage(document.scripts)
  sendPublisherInfoForChannel(channelId)
}

const sendMediaDurationMetadata = (url: URL) => {
  const searchParams = new URLSearchParams(url.search)

  const mediaId = utils.getMediaIdFromParts(searchParams)
  const mediaKey = utils.buildMediaKey(mediaId)
  const duration = utils.getMediaDurationFromParts(searchParams)

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

  firstVisit = false
}

const handleOnCompletedWebRequest = (mediaType: string, details: any) => {
  if (mediaType !== types.mediaType) {
    return
  }

  if (!details || !details.url) {
    return
  }

  const url = new URL(details.url)
  sendMediaDurationMetadata(url)
}

// Register an OnCompleted webRequest handler for this script
const registerOnCompletedWebRequestHandler = () => {
  if (registeredOnCompletedWebRequestHandler) {
    return
  }

  registeredOnCompletedWebRequestHandler = true

  if (!port) {
    return
  }

  port.postMessage({
    type: 'RegisterOnCompletedWebRequest',
    mediaType: types.mediaType,
    data: {
      urlPatterns: [ mediaDurationUrlPattern ]
    }
  })

  port.onMessage.addListener((msg) => {
    switch (msg.type) {
      case 'OnCompletedWebRequest': {
        handleOnCompletedWebRequest(msg.mediaType, msg.details)
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

  // Connect port for communications with Rewards background page
  port = chrome.runtime.connect(braveRewardsExtensionId, { name: 'Greaselion' })

  // Load publisher info and register webRequest.OnCompleted handler when document finishes loading
  // Note: Not needed for video paths, as 'yt-page-data-updated' handles those
  document.addEventListener('readystatechange', function () {
    if (document.readyState === 'complete' &&
        document.visibilityState === 'visible' &&
        !utils.isVideoPath(location.pathname)) {
      setTimeout(() => {
        registerOnCompletedWebRequestHandler()
        sendPublisherInfo()
      }, 200)
    }
  })

  // Load publisher info and register webRequest.OnCompleted handler on visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      registerOnCompletedWebRequestHandler()
      sendPublisherInfo()
    }
  })

  // Load publisher info and register webRequest.OnCompleted handler on page data update
  // Note: Can't use 'yt-navigate-finish' for this, as data may not have
  // finished loading by then
  document.addEventListener('yt-page-data-updated', function () {
    if (document.visibilityState === 'visible') {
      registerOnCompletedWebRequestHandler()
      sendPublisherInfo()
    }
    firstVisit = true
  })

  console.info('Greaselion script loaded: youtube.ts')
}

initScript()
