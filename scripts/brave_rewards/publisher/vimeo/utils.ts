/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as utils from '../common/utils'

export const buildFavIconUrl = (userId: string) => {
  if (!userId) {
    return ''
  }

  return `https://i.vimeocdn.com/portrait/${userId}_300x300.webp`
}

export const buildVideoUrl = (mediaId: string) => {
  if (!mediaId) {
    return ''
  }

  return `https://vimeo.com/${mediaId}`
}

export const getPublisherNameFromPublisherPageResponse = (response: string) => {
  if (!response) {
    return ''
  }

  let publisherName = getPublisherNameFromVideoPageResponse(response)
  if (!publisherName) {
    publisherName = utils.extractData(
      response,
      '<meta property="og:title" content="',
      '"')
  }

  return utils.decodeHTMLEntities(publisherName)
}

export const getPublisherNameFromVideoPageResponse = (response: string) => {
  if (!response) {
    return ''
  }

  const publisherNameJson = utils.extractData(response, '"display_name":"', '"')
  if (!publisherNameJson) {
    return ''
  }

  let object = null
  try {
    object = JSON.parse(`{"brave_publisher":"${publisherNameJson}"}`)
  } catch (error) {
    throw new Error(`Error parsing publisher name from video page: ${error}`)
  }

  return utils.decodeHTMLEntities(object.brave_publisher)
}

export const getUserIdFromPublisherPageResponse = (response: string) => {
  if (!response) {
    return ''
  }

  let userId = utils.extractData(
    response,
    '<meta property="al:ios:url" content="vimeo://app.vimeo.com/users/',
    '"')
  if (userId) {
    return userId
  }

  userId = utils.extractData(
    response,
    '<meta property="al:android:url" content="vimeo://app.vimeo.com/users/',
    '"')
  if (userId) {
    return userId
  }

  return utils.extractData(
    response,
    '<link rel="canonical" href="/',
    '"')
}

export const getUserIdFromVideoPageResponse = (response: string) => {
  if (!response) {
    return ''
  }

  return utils.extractData(response, '"creator_id":', ',')
}

export const getVideoIdFromVideoPageResponse = (response: string) => {
  if (!response) {
    return ''
  }

  return utils.extractData(
    response,
    '<link rel="canonical" href="https://vimeo.com/',
    '"')
}

export const isAllowedEvent = (event: string) => {
  if (!event) {
    return false
  }

  const events = [
    'video-start-time',
    'video-minute-watched',
    'video-paused',
    'video-played',
    'video-seek',
    'video-seeked'
  ]

  if (events.includes(event)) {
    return true
  }

  return false
}

export const isVideoPath = (path: string) => {
  if (path && /^\/\d+$/.test(path)) {
    return true
  }

  return false
}

export const isExcludedPath = (path: string) => {
  if (!path) {
    return false
  }

  const paths = [
    '/',
    '/about',
    '/blog',
    '/enterprise',
    '/help',
    '/jobs',
    '/live',
    '/log_in',
    '/ondemand',
    '/ott',
    '/purchases',
    '/search',
    '/settings',
    '/site_map',
    '/stats',
    '/stock',
    '/upgrade',
    '/upload',
    '/videoschool',
    '/watch',
    '/watchlater'
  ]

  if (paths.includes(path) || paths.includes(path + '/')) {
    return true
  }

  // In general, we block urls that start with '/channels/' but let
  // this one through
  if (path.startsWith('/channels/staffpicks/')) {
    return false
  }

  const startPatterns = [
    '/blog/',
    '/categories/',
    '/channels/',
    '/features/',
    '/help/',
    '/manage/',
    '/ott/',
    '/settings/',
    '/solutions/',
    '/stock/'
  ]

  for (const pattern of startPatterns) {
    if (path.startsWith(pattern)) {
      return true
    }
  }

  return false
}
