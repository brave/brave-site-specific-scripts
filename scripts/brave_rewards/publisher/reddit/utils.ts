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

export const isThreadPath = (path: string) => {
  if (!path) {
    return false
  }

  return path.startsWith('/r/') && path.includes('/comments/')
}

export const getProfileUrlResponse = async (screenName: string, isOldReddit: boolean) => {
  if (!screenName) {
    throw new Error('Invalid parameters')
  }

  const profileUrl = buildProfileUrl(screenName, isOldReddit)
  if (!profileUrl) {
    throw new Error('Invalid profile url')
  }

  const response = await fetch(profileUrl)
  if (!response.ok) {
    throw new Error(`Profile request failed: ${response.statusText} (${response.status})`)
  }

  return response.text()
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

export const getUserIdFromResponse = (response: string) => {
  if (!response) {
    return ''
  }

  // Try new reddit format first, then old reddit format
  const pattern = utils.extractData(response, 'hideFromRobots":', '"isEmployee"')
  let userId = utils.extractData(pattern, '"id":"t2_', '"')
  if (!userId) {
    userId = utils.extractData(response, 'target_fullname": "t2_', '"')
  }

  return userId
}

export const getProfileImageUrlFromResponse = (response: string) => {
  if (!response) {
    return ''
  }

  // Only new reddit supports account icons
  return utils.extractData(response, 'accountIcon":"', '?')
}

export const getPublisherNameFromResponse = (response: string) => {
  if (!response) {
    return ''
  }

  // Try new reddit format first, then old reddit format
  let userName = utils.extractData(response, 'username":"', '"')
  if (!userName) {
    userName = utils.extractData(response, 'target_name": "', '"')
  }

  return userName
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
    '/wiki/'
  ]

  for (const pattern of startPatterns) {
    if (path.startsWith(pattern)) {
      return true
    }
  }

  // In general, we exclude forums unless they represent a thread
  if (path.startsWith('/r/') && !isThreadPath(path)) {
    return true
  }

  return false
}
