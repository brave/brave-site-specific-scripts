/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as utils from './publisher_utils'

const braveRewardsExtensionId = 'jidkidbbcafjabdphckchenhfomhnfma'

const mediaType = 'youtube'
const mediaDurationUrlRegex = 'https://www.youtube.com/api/stats/watchtime?*'

let port: chrome.runtime.Port | null = null

let registeredMediaDurationHandler = false

const buildChannelUrl = (channelId: string) => {
  return `https://www.youtube.com/channel/${channelId}`
}

const buildMediaKey = (mediaId: string) => {
  return `${mediaType}_${mediaId}`
}

const buildPublisherKey = (key: string) => {
  return `${mediaType}#channel:${key}`
}

const buildVideoUrl = (mediaId: string) => {
  return `https://www.youtube.com/watch?v=${mediaId}`
}

const getFavIconUrlFromPage = () => {
  const scripts = document.scripts

  for (const script of scripts) {
    let match = utils.extractData(script.text, '"avatar":{"thumbnails":[{"url":"', '"')
    if (match) {
      return match
    }

    match = utils.extractData(script.text, '"width":88,"height":88},{"url":"', '"')
    if (match) {
      return match
    }
  }

  return ''
}

const getFavIconUrlFromResponse = (data: string) => {
  let match = utils.extractData(data, '"avatar":{"thumbnails":[{"url":"', '"')
  if (match) {
    return match
  }

  match = utils.extractData(data, '"width":88,"height":88},{"url":"', '"')
  if (match) {
    return match
  }

  return ''
}

const getChannelIdFromUrl = (path: string) => {
  if (!path) {
    return ''
  }

  const id = utils.extractData(path + '/', '/channel/', '/')
  if (!id) {
    return ''
  }

  const params = id.split('?')
  if (!params || params.length === 0) {
    return ''
  }

  return params[0]
}

const getChannelIdFromChannelPage = () => {
  const scripts = document.scripts

  for (const script of scripts) {
    let match = utils.extractData(script.text, '"ucid":"', '"')
    if (match) {
      return match
    }

    match = utils.extractData(script.text, 'HeaderRenderer":{"channelId":"', '"')
    if (match) {
      return match
    }

    match = utils.extractData(script.text, '<link rel="canonical" href="https://www.youtube.com/channel/', '">')
    if (match) {
      return match
    }

    match = utils.extractData(script.text, 'browseEndpoint":{"browseId":"', '"')
    if (match) {
      return match
    }
  }

  return ''
}

const getChannelIdFromResponse = (data: string) => {
  let match = utils.extractData(data, '"ucid":"', '"')
  if (match) {
    return match
  }

  match = utils.extractData(data, 'HeaderRenderer":{"channelId":"', '"')
  if (match) {
    return match
  }

  match = utils.extractData(data, '<link rel="canonical" href="https://www.youtube.com/channel/', '">')
  if (match) {
    return match
  }

  match = utils.extractData(data, 'browseEndpoint":{"browseId":"', '"')
  if (match) {
    return match
  }

  return ''
}

const getChannelNameFromChannelPage = () => {
  const channelName = document.querySelector('#channel-container #text-container') as HTMLElement
  if (!channelName) {
    return ''
  }

  return channelName.innerText.trim()
}

const getMediaIdFromUrl = (url: URL) => {
  const searchParams = new URLSearchParams(url.search)
  if (!searchParams) {
    return ''
  }

  return searchParams.get('v')
}

const getMediaIdFromChannelPage = () => {
  const anchor = document.querySelector('#contents .ytp-title-link') as HTMLAnchorElement
  if (!anchor) {
    return ''
  }

  if (!anchor.href) {
    return ''
  }

  const url = new URL(anchor.href)
  if (!url) {
    return ''
  }

  const searchParams = new URLSearchParams(url.search)
  return searchParams.get('v') || ''
}

const getMediaIdFromParts = (searchParams: URLSearchParams) => {
  return searchParams.get('docid') || ''
}

const getMediaDurationFromParts = (searchParams: URLSearchParams) => {
  const stParam = searchParams.get('st')
  const etParam = searchParams.get('et')
  if (!stParam || !etParam) {
    return 0
  }

  const startTimes = stParam.split(',')
  if (!startTimes || startTimes.length === 0) {
    return 0
  }

  const endTimes = etParam.split(',')
  if (!endTimes || endTimes.length === 0) {
    return 0
  }

  if (startTimes.length !== endTimes.length) {
    return 0
  }

  // Combine all of the intervals (should only be one set if there were no seeks)
  let duration = 0
  for (let i = 0; i < startTimes.length; ++i) {
    const st = parseFloat(startTimes[i])
    const et = parseFloat(endTimes[i])
    duration += Math.round(et - st)
  }

  return duration
}

const getBasicPath = (path: string) => {
  let ytPath = path.substring(0, path.indexOf('/', 1))

  if (!ytPath || ytPath === path) {
    ytPath = path.substring(0, path.indexOf('?', 1))
    if (!ytPath || ytPath === path) {
      ytPath = path
    }
  }

  return ytPath
}

const isVideoPath = (path: string) => {
  if (location.pathname.endsWith('/watch')) {
    return true
  }

  return false
}

const isChannelPath = (path: string) => {
  if (location.pathname.includes('/channel/')) {
    return true
  }

  return false
}

const isUserPath = (path: string) => {
  if (location.pathname.includes('/user/')) {
    return true
  }

  return false
}

const isPredefinedPath = (path: string) => {
  const paths = [
    '/feed',
    '/channel',
    '/user',
    '/watch',
    '/account',
    '/gaming',
    '/playlist',
    '/premium',
    '/reporthistory',
    '/pair',
    '/account_notifications',
    '/account_playback',
    '/account_privacy',
    '/account_sharing',
    '/account_billing',
    '/account_advanced',
    '/subscription_manager',
    '/oops'
  ]

  const cleanPath = getBasicPath(path)
  for (const strPath of paths) {
    if (cleanPath === strPath) {
      return true
    }
  }

  return false
}

const getPublisherNameFromResponse = (data: string) => {
  const publisherNameJson = utils.extractData(data, '"author":"', '"')
  if (!publisherNameJson) {
    return ''
  }

  let object = null
  try {
    object = JSON.parse(`{"brave_publisher":"${publisherNameJson}"}`)
  } catch (error) {
    throw new Error(`Error parsing publisher name from response: ${error}`)
  }

  return object.brave_publisher
}

const getUserFromUrl = (path: string) => {
  if (!path) {
    return ''
  }

  const id = utils.extractData(path + '/', '/user/', '/')
  if (!id) {
    return ''
  }

  const params = id.split('?')
  if (!params || params.length === 0) {
    return ''
  }

  return params[0]
}

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

  const publisherKey = buildPublisherKey(channelId)
  const publisherName = getChannelNameFromChannelPage()
  const favIconUrl = getFavIconUrlFromPage()

  // This media key represents the channel trailer video
  let mediaKey = ''
  const mediaId = getMediaIdFromChannelPage()
  if (mediaId) {
    mediaKey = buildMediaKey(mediaId)
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
  const channelId = getChannelIdFromChannelPage()
  if (!channelId) {
    sendErrorResponse('Unable to scrape channel id')
    return
  }

  const user = getUserFromUrl(location.pathname)
  if (!user) {
    sendErrorResponse('Unable to extract user from url')
    return
  }

  const publisherKey = buildPublisherKey(channelId)
  const publisherName = getChannelNameFromChannelPage()

  // This media key represents the channel trailer video
  let mediaKey = ''
  const mediaId = getMediaIdFromChannelPage()
  if (mediaId) {
    mediaKey = buildMediaKey(mediaId)
  }

  const publisherUrl = buildChannelUrl(channelId)

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
  const favIconUrl = getFavIconUrlFromResponse(responseText)
  const channelId = getChannelIdFromResponse(responseText)
  const publisherKey = buildPublisherKey(channelId)

  const mediaId = getMediaIdFromUrl(new URL(url))
  if (!mediaId) {
    return
  }

  const mediaKey = buildMediaKey(mediaId)

  if (!publisherName) {
    publisherName = getPublisherNameFromResponse(responseText)
  }

  if (!publisherUrl) {
    publisherUrl = buildChannelUrl(channelId)
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

  const mediaId = getMediaIdFromUrl(new URL(url))
  if (!mediaId) {
    return
  }

  const videoUrl = buildVideoUrl(mediaId)
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
  if (isVideoPath(location.pathname)) {
    sendPublisherInfoForVideo()
  } else if (isChannelPath(location.pathname)) {
    const channelId = getChannelIdFromUrl(location.pathname)
    sendPublisherInfoForChannel(channelId)
  } else if (isUserPath(location.pathname)) {
    sendPublisherInfoForUser()
  } else if (!isPredefinedPath(location.pathname)) {
    const channelId = getChannelIdFromChannelPage()
    sendPublisherInfoForChannel(channelId)
  }
}

const sendMediaDurationMetadataResponse = (url: URL) => {
  const searchParams = new URLSearchParams(url.search)

  const mediaId = getMediaIdFromParts(searchParams)
  const mediaKey = buildMediaKey(mediaId)

  const duration = getMediaDurationFromParts(searchParams)

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

  port = chrome.runtime.connect(braveRewardsExtensionId, { name: 'Greaselion' })
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

  // Load publisher info and register media duration handler when document finishes loading
  // Note: Not needed for video paths, as 'yt-page-data-updated' handles those
  document.addEventListener('readystatechange', function () {
    if (document.readyState === 'complete' &&
        document.visibilityState === 'visible' &&
        !isVideoPath(location.pathname)) {
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

  console.info('Greaselion script loaded: publisher_youtube.ts')
}

initScript()
