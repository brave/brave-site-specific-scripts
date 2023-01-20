/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as utils from '../common/utils'

export const buildProfileUrl = (screenName: string, isOldReddit: boolean) => {
  if (!screenName) {
    return ''
  }

  let subdomain = 'www'
  if (isOldReddit) {
    subdomain = 'old'
  }

  return `https://${subdomain}.reddit.com/user/${screenName}/`
}

export const isOldRedditUrl = (url: URL) => {
  return url.hostname.startsWith('old.') || url.hostname.startsWith('np.')
}

export const getProfileData = async (
  screenName: string,
  isOldReddit: boolean
) => {
  if (!screenName) {
    throw new Error('Invalid parameters')
  }

  const profileUrl = buildProfileUrl(screenName, isOldReddit)
  if (!profileUrl) {
    throw new Error('Invalid profile url')
  }

  const profileDataUrl = profileUrl + 'about.json'

  const response = await fetch(profileDataUrl)
  if (!response.ok) {
    const msg = utils.formatNetworkError('Profile request failed', response)
    throw new Error(msg)
  }

  const text = await response.text()
  if (!text) {
    throw new Error('Profile response is empty')
  }

  const parsedResponse = JSON.parse(text)
  if (!parsedResponse) {
    throw new Error('Unable to parse profile response')
  }

  if (parsedResponse.kind !== 't2' || !parsedResponse.data) {
    throw new Error('Unexpected profile response data')
  }

  return parsedResponse.data
}

export const getScreenNameFromUrl = (url: URL) => {
  if (!url.pathname || !url.pathname.startsWith('/user/')) {
    return ''
  }

  const pathComponents = url.pathname.split('/').filter(item => item)
  if (!pathComponents || pathComponents.length === 0) {
    return ''
  }

  if (pathComponents.length < 2) {
    return ''
  }

  return pathComponents[1]
}

export const isExcludedPath = (path: string) => {
  const paths = [
    '/',
    '/coins',
    '/contact',
    '/login',
    '/premium'
  ]

  if (paths.includes(path)) {
    return true
  }

  const startPatterns = [
    '/dev/',
    '/help/',
    '/r/',
    '/wiki/'
  ]

  for (const pattern of startPatterns) {
    if (path.startsWith(pattern)) {
      return true
    }
  }

  return false
}
