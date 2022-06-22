/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getPort } from '../common/messaging'
import { getAuthHeaders, hasRequiredAuthHeaders } from './auth'

import * as types from './types'

let lastRequestTime = 0

const sendAPIRequest = (name: string, url: string) => {
  return new Promise((resolve, reject) => {
    if (!name || !url) {
      reject(new Error('Invalid parameters'))
      return
    }

    if (!hasRequiredAuthHeaders()) {
      reject(new Error('Missing auth headers'))
      return
    }

    const port = getPort()
    if (!port) {
      reject(new Error('Invalid port'))
      return
    }

    if ((lastRequestTime !== 0) && (Date.now() - lastRequestTime < 3000)) {
      reject(new Error('Ignoring API request due to network throttle'))
      return
    }

    lastRequestTime = Date.now()

    const authHeaders = getAuthHeaders()
    port.postMessage({
      type: 'OnAPIRequest',
      mediaType: types.mediaType,
      data: {
        name,
        url,
        init: {
          credentials: 'include',
          headers: {
            ...authHeaders
          },
          referrerPolicy: 'no-referrer-when-downgrade',
          method: 'GET',
          redirect: 'follow'
        }
      }
    })

    port.onMessage.addListener(function onMessageListener (msg: any) {
      if (!port) {
        reject(new Error('Invalid port'))
        return
      }
      if (!msg || !msg.data) {
        port.onMessage.removeListener(onMessageListener)
        reject(new Error('Invalid message'))
        return
      }
      if (msg.type === 'OnAPIResponse') {
        if (!msg.data.name || (!msg.data.response && !msg.data.error)) {
          port.onMessage.removeListener(onMessageListener)
          reject(new Error('Invalid message'))
          return
        }
        if (msg.data.name === name) {
          port.onMessage.removeListener(onMessageListener)
          if (msg.data.error) {
            reject(new Error(msg.data.error))
            return
          }
          resolve(msg.data.response)
        }
      }
    })
  })
}

export const getTweetDetails = async (tweetId: string) => {
  if (!tweetId) {
    return Promise.reject(new Error('Invalid parameters'))
  }

  const url = `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}`
  return sendAPIRequest('GetTweetDetails', url)
}

export const getUserDetails = async (screenName: string) => {
  if (!screenName) {
    return Promise.reject(new Error('Invalid parameters'))
  }

  const url =
    `https://api.twitter.com/1.1/users/show.json?screen_name=${screenName}`
  return sendAPIRequest('GetUserDetails', url)
}
