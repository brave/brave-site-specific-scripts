/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as types from './types'
import * as utils from '../common/utils'

export const buildChannelUrl = (channelId: string) => {
  return `https://www.youtube.com/channel/${channelId}`
}

export const buildMediaKey = (mediaId: string) => {
  return `${types.mediaType}_${mediaId}`
}

export const buildPublisherKey = (key: string) => {
  return `${types.mediaType}#channel:${key}`
}

export const buildVideoUrl = (mediaId: string) => {
  return `https://www.youtube.com/watch?v=${mediaId}`
}

export const getFavIconUrlFromPage = () => {
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

export const getFavIconUrlFromResponse = (data: string) => {
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

export const getChannelIdFromUrl = (path: string) => {
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

export const getChannelIdFromChannelPage = () => {
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

export const getChannelIdFromResponse = (data: string) => {
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

export const getChannelNameFromChannelPage = () => {
  const channelName = document.querySelector('#channel-container #text-container') as HTMLElement
  if (!channelName) {
    return ''
  }

  return channelName.innerText.trim()
}

export const getMediaIdFromUrl = (url: URL) => {
  const searchParams = new URLSearchParams(url.search)
  if (!searchParams) {
    return ''
  }

  return searchParams.get('v') || ''
}

export const getMediaIdFromChannelPage = () => {
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

  return getMediaIdFromUrl(url)
}

export const getMediaIdFromParts = (searchParams: URLSearchParams) => {
  return searchParams.get('docid') || ''
}

export const getMediaDurationFromParts = (searchParams: URLSearchParams) => {
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

export const getBasicPath = (path: string) => {
  let ytPath = path.substring(0, path.indexOf('/', 1))

  if (!ytPath || ytPath === path) {
    ytPath = path.substring(0, path.indexOf('?', 1))
    if (!ytPath || ytPath === path) {
      ytPath = path
    }
  }

  return ytPath
}

export const isVideoPath = (path: string) => {
  if (location.pathname.endsWith('/watch')) {
    return true
  }

  return false
}

export const isChannelPath = (path: string) => {
  if (location.pathname.includes('/channel/')) {
    return true
  }

  return false
}

export const isUserPath = (path: string) => {
  if (location.pathname.includes('/user/')) {
    return true
  }

  return false
}

export const isPredefinedPath = (path: string) => {
  const paths = [
    '/',
    '/account',
    '/account_advanced',
    '/account_billing',
    '/account_notifications',
    '/account_playback',
    '/account_privacy',
    '/account_sharing',
    '/channel',
    '/feed',
    '/gaming',
    '/oops',
    '/pair',
    '/playlist',
    '/premium',
    '/reporthistory',
    '/subscription_manager',
    '/user',
    '/watch'
  ]

  const cleanPath = getBasicPath(path)
  for (const strPath of paths) {
    if (cleanPath === strPath) {
      return true
    }
  }

  return false
}

export const getPublisherNameFromResponse = (data: string) => {
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

export const getUserFromUrl = (path: string) => {
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
