/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

type SessionId = string | null

const authHeaderNames = [
  'authorization',
  'x-csrf-token',
  'x-guest-token'
]

const authTokenCookieRegex = /[; ]_twitter_sess=([^\s;]*)/

let lastSessionId: SessionId = null

let authHeaders = {}

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

export const processRequestHeaders = (requestHeaders: any[]) => {
  if (!requestHeaders) {
    return {}
  }

  for (const header of requestHeaders) {
    // Parse cookies for session id
    if (header.name === 'Cookie') {
      const currentSessionId = readSessionCookie(header.value as string)
      const hasAuthChanged = (currentSessionId !== lastSessionId)
      if (hasAuthChanged) {
        // Clear cached auth data when session changes
        lastSessionId = currentSessionId
        authHeaders = {}
      }
    } else if (authHeaderNames.includes(header.name) || header.name.startsWith('x-twitter-')) {
      authHeaders[header.name] = header.value
    }
  }

  return authHeaders
}
