/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { mediaType, mediaDomain } from './types'

const getCurrentFavIcon = (): string => {
  const elem = document.querySelector('.channel-info-content .tw-avatar [src]')
  return (elem && elem.getAttribute('src')) || ''
}

const getChannelTitleElement = (): HTMLElement | null => {
  return document.querySelector('h1.tw-title')
}

const getCurrentPublisherName = (): string => {
  const elem = getChannelTitleElement()
  return elem && elem.textContent || ''
}

const firstPathComponent = (path: string): string => {
  return path.replace(/^\/|\/[\s\S]*/g, '')
}

const excludedPaths = new Set([
  'directory',
  'downloads',
  'jobs',
  'p',
  'search',
  'turbo'
])

export const getExcludedPaths = () => Array.from(excludedPaths)

const isVideoPath = () => {
  return firstPathComponent(location.pathname).toLowerCase() === 'videos'
}

export const getCurrentMediaId = (): string => {
  if (isVideoPath()) {
    const elem = getChannelTitleElement()
    if (!elem || !elem.parentElement) {
      return ''
    }
    const href = elem.parentElement.getAttribute('href')
    return href ? firstPathComponent(href).toLowerCase() : ''
  }

  const pathComponent = firstPathComponent(location.pathname).toLowerCase()
  return excludedPaths.has(pathComponent) ? '' : pathComponent
}

export const getCurrentMediaKey = (mediaId: string): string => {
  if (!mediaId) {
    return ''
  }

  const videoPathPattern = /^\/*videos\//i
  if (videoPathPattern.test(location.pathname)) {
    const rest = location.pathname.replace(videoPathPattern, '')
    const videoId = firstPathComponent(rest)
    return videoId ? `${mediaType}_${mediaId}_void_${videoId}` : ''
  }

  return `${mediaType}_${mediaId}`
}

export const getPublisherKey = (mediaId: string): string => {
  return mediaId ? `${mediaType}#author:${mediaId}` : ''
}

interface TwitchPublisherInfo {
  mediaId: string
  mediaKey: string
  publisherUrl: string
  publisherKey: string
  publisherName: string
  favIconUrl: string
}

const defaultPublisherInfo = (): TwitchPublisherInfo => {
  return {
    mediaId: '',
    mediaKey: '',
    publisherUrl: `https://${mediaDomain}`,
    publisherKey: mediaDomain,
    publisherName: mediaDomain,
    favIconUrl: ''
  }
}

export const getCurrentPublisherInfo = (): TwitchPublisherInfo => {
  const mediaId = getCurrentMediaId()
  if (!mediaId) {
    return defaultPublisherInfo()
  }

  return {
    mediaId,
    mediaKey: getCurrentMediaKey(mediaId),
    publisherUrl: `https://${mediaDomain}/${mediaId}`,
    publisherKey: getPublisherKey(mediaId),
    publisherName: getCurrentPublisherName(),
    favIconUrl: getCurrentFavIcon()
  }
}

export class PublisherInfoReader {
  previous: TwitchPublisherInfo

  constructor () {
    this.previous = defaultPublisherInfo()
  }

  async read () {
    let info = getCurrentPublisherInfo()

    const nonProfilePage = !info.mediaId && !isVideoPath()
    if (nonProfilePage) {
      this.previous = info
      return info
    }

    let { previous } = this

    const samePublisher = () => (
      info.mediaId && previous.mediaId === info.mediaId
    )

    const updateComplete = () => (
      info.mediaId &&
      info.publisherName &&
      info.favIconUrl && (
        samePublisher() ||
        info.publisherName !== previous.publisherName &&
        info.favIconUrl !== previous.favIconUrl
      )
    )

    // Various elements within the document are updated with
    // nondeterminstic timing. Poll the document until the
    // required elements have been created or upated from
    // their previous values.

    const step = 250
    const max = 5000

    for (let i = 0; i < max && !updateComplete(); i += step) {
      await new Promise((resolve) => setTimeout(resolve, step))
      info = getCurrentPublisherInfo()
    }

    this.previous = info
    return info
  }
}
