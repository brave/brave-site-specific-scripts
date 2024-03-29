/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as commonUtils from '../common/utils'

type SessionId = string | null

const authHeaderNames = [
  'authorization',
  'x-csrf-token',
  'x-guest-token'
]

const authTokenCookieRegex = /[; ]_twitter_sess=([^\s;]*)/

let lastSessionId: SessionId = null

let authHeaders: any = {}

const readSessionCookie = (cookiesString: string): SessionId => {
  if (!cookiesString) {
    return null
  }

  const match = cookiesString.match(authTokenCookieRegex)
  if (!match) {
    return null
  }

  return unescape(match[1])
}

export const getAuthHeaders = () => {
  return authHeaders
}

export const hasRequiredAuthHeaders = () => {
  return authHeaders.authorization &&
         ((authHeaders['x-csrf-token'] && authHeaders['x-twitter-auth-type']) ||
          (authHeaders['x-csrf-token'] && authHeaders['x-guest-token']))
}

export const processRequestHeaders = (requestHeaders: any[]) => {
  if (!requestHeaders) {
    return false
  }

  let headers = {}

  for (const header of requestHeaders) {
    // Parse cookies for session id
    if (header.name === 'Cookie') {
      const currentSessionId = readSessionCookie(header.value as string)
      const hasAuthChanged = (currentSessionId !== lastSessionId)
      if (hasAuthChanged) {
        // Clear cached auth data when session changes
        lastSessionId = currentSessionId
        headers = {}
      }
    } else if (authHeaderNames.includes(header.name) ||
               header.name.startsWith('x-twitter-')) {
      headers[header.name] = header.value
    }
  }

  // For our purposes (authentication), we want this always to be 'yes'
  if (headers['x-twitter-active-user'] !== 'yes') {
    headers['x-twitter-active-user'] = 'yes'
  }

  if (commonUtils.areObjectsEqualShallow(authHeaders, headers)) {
    return false
  }

  authHeaders = headers
  return true
}
