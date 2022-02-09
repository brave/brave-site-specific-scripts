/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as utils from '../common/utils'

export const buildChannelUrl = (channelId: string) => {
  return `https://www.youtube.com/channel/${channelId}/videos`
}

export const buildVideoUrl = (mediaId: string) => {
  return `https://www.youtube.com/watch?v=${mediaId}`
}

export const getFavIconUrlFromPage = (
  scripts: HTMLCollectionOf<HTMLScriptElement>
) => {
  for (const script of scripts) {
    const match = getFavIconUrlFromResponse(script.text)
    if (match) {
      return match
    }
  }

  return ''
}

export const getFavIconUrlFromResponse = (data: string) => {
  if (!data) {
    return ''
  }

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

export const getChannelIdFromResponse = (data: string) => {
  if (!data) {
    return ''
  }

  let match = utils.extractData(data, '"ucid":"', '"')
  if (match) {
    return match
  }

  match = utils.extractData(data, 'HeaderRenderer":{"channelId":"', '"')
  if (match) {
    return match
  }

  match = utils.extractData(
    data, '<link rel="canonical" href="https://www.youtube.com/channel/', '">')
  if (match) {
    return match
  }

  match = utils.extractData(data, 'browseEndpoint":{"browseId":"', '"')
  if (match) {
    return match
  }

  return ''
}

export const getChannelNameFromResponse = (data: string) => {
  if (!data) {
    return ''
  }

  const match = utils.extractData(data, '<meta itemprop="name" content="', '"')
  if (match) {
    return utils.decodeHTMLEntities(match)
  }

  return ''
}

export const getChannelNameElementFromChannelPage = () => {
  return document.
    querySelector('#channel-container #text-container') as HTMLElement
}

export const getChannelNameFromElement = (element: HTMLElement) => {
  if (!element) {
    return ''
  }

  return element.innerText.trim()
}

export const getMediaIdAnchorFromChannelPage = () => {
  return document.
    querySelector('#contents .ytp-title-link') as HTMLAnchorElement
}

export const getMediaIdFromAnchor = (anchor: HTMLAnchorElement) => {
  if (!anchor || !anchor.href) {
    return ''
  }

  const url = new URL(anchor.href)
  if (!url) {
    return ''
  }

  return getMediaIdFromUrl(url)
}

export const getMediaIdFromUrl = (url: URL) => {
  if (!url) {
    return ''
  }

  const searchParams = new URLSearchParams(url.search)
  if (!searchParams) {
    return ''
  }

  return searchParams.get('v') || ''
}

export const getMediaIdFromParts = (searchParams: URLSearchParams) => {
  if (!searchParams) {
    return ''
  }
  return searchParams.get('docid') || ''
}

export const getMediaDurationFromParts = (searchParams: URLSearchParams) => {
  if (!searchParams) {
    return 0
  }

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

  // Combine all of the intervals (should only be one set if there
  // were no seeks)
  let duration = 0
  for (let i = 0; i < startTimes.length; ++i) {
    const st = parseFloat(startTimes[i])
    const et = parseFloat(endTimes[i])
    duration += Math.round(et - st)
  }

  return duration
}

export const getBasicPath = (path: string) => {
  if (!path) {
    return ''
  }

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
  if (path && path.endsWith('/watch')) {
    return true
  }

  return false
}

export const isChannelPath = (path: string) => {
  if (path && path.includes('/channel/')) {
    return true
  }

  return false
}

export const isUserPath = (path: string) => {
  if (path && path.includes('/user/')) {
    return true
  }

  return false
}

export const isExcludedPath = (path: string) => {
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

  if (!path) {
    return false
  }

  const cleanPath = getBasicPath(path)
  for (const strPath of paths) {
    if (cleanPath === strPath) {
      return true
    }
  }

  return false
}

export const getPublisherNameFromResponse = (data: string) => {
  if (!data) {
    return ''
  }

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
