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

class AuthHeaders {
  [header: string]: string;
}

let authHeaders: AuthHeaders = {}

const readSessionCookie = (): SessionId => {
  if (!document.cookie) {
    return null
  }

  const match = document.cookie.match(authTokenCookieRegex)
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

export const processRequestHeaders = (requestHeaders: {[header: string]: string}) => {
  if (!requestHeaders) {
    return false
  }

  let headers = new AuthHeaders()

  const currentSessionId = readSessionCookie()
  const hasAuthChanged = (currentSessionId !== lastSessionId)
  if (hasAuthChanged) {
    // Clear cached auth data when session changes
    lastSessionId = currentSessionId
    // TODO: why it was headers = {}?
    authHeaders = {}
  }
  for (const name in requestHeaders) {
    const value = requestHeaders[name]
    // Parse cookies for session id
    if (authHeaderNames.includes(name) ||
               name.startsWith('x-twitter-')) {
      headers[name] = value
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
