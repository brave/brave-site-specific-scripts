/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

export const buildProfileUrl = (screenName: string, userId?: string) => {
  if (!screenName) {
    return ''
  }

  if (userId) {
    return `https://twitter.com/intent/user?user_id=${userId}&screen_name=${screenName}`
  }

  return `https://twitter.com/${screenName}/`
}

export const getPublisherNameFromPage = () => {
  const components = document.title.split('(@')
  if (!components ||
      components.length <= 1 ||
      components[0] === document.title) {
    return ''
  }

  return components[0].trim()
}

export const getTweetId = (tweet: Element, isNewTwitter: boolean) => {
  if (!tweet) {
    return null
  }

  if (!isNewTwitter) {
    return tweet.getAttribute('data-tweet-id')
  }

  const status = tweet.querySelector("a[href*='/status/']") as HTMLAnchorElement
  if (!status || !status.href) {
    return null
  }

  const tweetIdMatches = status.href.match(/status\/(\d+)/)
  if (!tweetIdMatches || tweetIdMatches.length < 2) {
    return null
  }

  return tweetIdMatches[1]
}

export const getScreenNameFromUrl = (url: URL) => {
  const searchParams = new URLSearchParams(url.search)
  if (!searchParams) {
    return ''
  }

  const screenName = searchParams.get('screen_name')
  if (screenName) {
    return unescape(screenName)
  }

  if (!url.pathname) {
    return ''
  }

  const pathComponents = url.pathname.split('/').filter(item => item)
  if (!pathComponents || pathComponents.length === 0) {
    return ''
  }

  return pathComponents[0]
}

export const isExcludedPath = (path: string) => {
  const paths = [
    '/',
    '/about',
    '/home',
    '/login',
    '/logout',
    '/messages',
    '/privacy',
    '/search',
    '/settings',
    '/tos'
  ]

  if (paths.includes(path)) {
    return true
  }

  const startPatterns = [
    '/account/',
    '/compose/',
    '/explore',
    '/hashtag/',
    '/i/',
    '/messages/',
    '/notifications',
    '/settings/',
    '/who_to_follow/',
    '/?login',
    '/?logout'
  ]

  for (const pattern of startPatterns) {
    if (path.startsWith(pattern)) {
      return true
    }
  }

  return false
}
