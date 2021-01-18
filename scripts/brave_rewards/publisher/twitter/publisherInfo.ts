/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LruCache } from '../common/lruCache'
import { getPort } from '../common/messaging'

import * as commonUtils from '../common/utils'

import * as api from './api'
import * as types from './types'
import * as utils from './utils'

const userCache = new LruCache<any>(128)

const savePublisherVisit = (screenName: string, userDetails: any) => {
  if (!screenName || !userDetails) {
    return
  }

  const userId = userDetails.id_str
  const publisherKey =
    commonUtils.buildPublisherKey(types.mediaType, userId)
  const publisherName = screenName
  const mediaKey = commonUtils.buildMediaKey(types.mediaType, screenName)
  const favIconUrl =
    userDetails.profile_image_url_https.replace('_normal', '')

  const profileUrl = utils.buildProfileUrl(screenName, userId)

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
}

const sendForExcludedPage = () => {
  const url = `https://${types.mediaDomain}`
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

const sendForStandardPage = (url: URL) => {
  const screenName = utils.getScreenNameFromUrl(url)
  if (!screenName) {
    return
  }

  const userDetails = userCache.get(screenName)
  if (userDetails) {
    savePublisherVisit(screenName, userDetails)
    return
  }

  api.getUserDetails(screenName)
    .then((userDetails: any) => {
      userCache.put(screenName, userDetails)
      savePublisherVisit(screenName, userDetails)
    })
    .catch(error => {
      console.error(`Failed to fetch user details for ${screenName}: ${error.message}`)
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
