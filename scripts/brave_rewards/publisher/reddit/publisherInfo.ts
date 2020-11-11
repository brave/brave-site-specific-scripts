/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MediaMetaData } from '../common/types'
import { getPort, sendErrorResponse } from '../common/messaging'

import * as types from './types'
import * as utils from './utils'

const getMediaMetaData = async (screenName: string, isOldReddit: boolean) => {
  if (!screenName) {
    throw new Error('Invalid parameters')
  }

  const response = await utils.getProfileUrlResponse(screenName, isOldReddit)
  return {
    user: {
      id: utils.getUserIdFromResponse(response),
      screenName: screenName,
      fullName: utils.getPublisherNameFromResponse(response),
      favIconUrl: utils.getProfileImageUrlFromResponse(response)
    },
    post: {
      id: '',
      timestamp: '',
      text: ''
    }
  }
}

const getScreenNameFromThread = () => {
  if (utils.isOldRedditUrl(new URL(location.href))) {
    return getScreenNameFromThreadForOldReddit()
  }

  const posts = document.getElementsByClassName('Post')
  if (!posts || posts.length === 0) {
    return ''
  }

  const anchor = posts[0].querySelector("a[href^='/user/']") as HTMLAnchorElement
  if (!anchor || !anchor.href) {
    return ''
  }

  const matches = anchor.href.match('/user/([^/]+)/?')
  if (!matches || matches.length !== 2) {
    return ''
  }

  return matches[1]
}

const getScreenNameFromThreadForOldReddit = () => {
  const posts = document.querySelectorAll(`div[data-type="link"]`)
  if (!posts || posts.length === 0) {
    return ''
  }

  const post = posts[posts.length - 1]

  const anchor = post.querySelector("a[href^='https://old.reddit.com/user/']") as HTMLAnchorElement
  if (!anchor || !anchor.href) {
    return ''
  }

  return anchor.href.replace('https://old.reddit.com/user/', '')
}

const sendForStandardPage = (url: URL) => {
  let screenName = ''

  // A standard page is either a user url or a thread url. For a user
  // url retrieve the screen name from the url. For a thread url,
  // retrieve the screen name from the first post in the thread.
  if (utils.isThreadPath(url.pathname)) {
    screenName = getScreenNameFromThread()
  } else {
    screenName = utils.getScreenNameFromUrl(url)
  }

  if (!screenName) {
    sendErrorResponse(types.mediaType, 'Invalid screen name')
    return
  }

  const isOldReddit = utils.isOldRedditUrl(url)

  return getMediaMetaData(screenName, isOldReddit)
    .then((mediaMetaData: MediaMetaData) => {
      const userId = mediaMetaData.user.id
      const publisherKey = utils.buildPublisherKey(userId)
      const publisherName = mediaMetaData.user.fullName
      if (!publisherName) {
        sendErrorResponse(types.mediaType, 'Invalid publisher name')
        return
      }

      const mediaKey = ''
      const favIconUrl = mediaMetaData.user.favIconUrl

      // Regardless of this being old or new reddit we want to
      // canonicalize the url as https://reddit.com/ on the server,
      // so pass false here
      const profileUrl = utils.buildProfileUrl(screenName, false)

      const port = getPort()
      if (!port) {
        return
      }

      port.postMessage({
        type: 'SavePublisherVisit',
        mediaType: types.mediaType,
        data: {
          url: profileUrl,
          publisherKey,
          publisherName,
          mediaKey,
          favIconUrl
        }
      })
    })
}

const sendForExcludedPage = () => {
  const url = `https://www.${types.mediaDomain}`
  const publisherKey = types.mediaDomain
  const publisherName = types.mediaDomain
  const mediaKey = ''
  const favIconUrl = ''

  const port = getPort()
  if (!port) {
    return
  }

  port.postMessage({
    type: 'SavePublisherVisit',
    mediaType: '',
    data: {
      url,
      publisherKey,
      publisherName,
      mediaKey,
      favIconUrl
    }
  })
}

export const send = () => {
  const url = new URL(location.href)
  if (utils.isExcludedPath(url.pathname)) {
    sendForExcludedPage()
  } else {
    sendForStandardPage(url)
  }
}
