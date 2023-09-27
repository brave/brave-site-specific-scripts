/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as types from './types'

let cachedXStore: any = null

const getXState = () => {
  if (cachedXStore) {
    return cachedXStore.getState()
  }

  const hostNode = document.querySelector('#react-root > div > div')
  const descriptors = Object.getOwnPropertyDescriptors(hostNode || {})

  if (hostNode) {
    for (const propertyName in descriptors) {
      if (propertyName.startsWith('__reactProps$')) {
        const reactProps = hostNode[propertyName]
        const store = reactProps?.children?.props?.store
        if (store && typeof store.getState === 'function') {
          cachedXStore = store
          return cachedXStore.getState()
        }
      }
    }
  }

  throw new Error('XStore initialization failed')
}

const getEntities = () => getXState().entities

export const getTweetDetails = async (tweetId: string): Promise<types.TweetDetails> => {
  if (!tweetId) {
    throw new Error('Invalid parameters')
  }

  const entities = getEntities()
  const tweet = entities.tweets.entities[tweetId]
  const tweetUser = entities.users.entities[tweet?.user ?? '']

  let response: types.TweetDetails = {}

  /**
   * We're explicitly checking that these properties both
   * exist, and have the expected type before adding them
   * to our response object.
   */

  if (typeof tweet.created_at === 'string') {
    response.created_at = tweet.created_at
  }

  if (typeof tweet.text === 'string') {
    response.text = tweet.text
  }

  response.user = {}

  if (typeof tweetUser.id_str === 'string') {
    response.user.id_str = tweetUser.id_str
  }

  if (typeof tweetUser.screen_name === 'string') {
    response.user.screen_name = tweetUser.screen_name
  }

  if (typeof tweetUser.name === 'string') {
    response.user.name = tweetUser.name
  }

  if (typeof tweetUser.profile_image_url_https === 'string') {
    response.user.profile_image_url_https = tweetUser.profile_image_url_https
  }

  return response
}

export const getUserDetails = async (screenName: string): Promise<types.UserDetails> => {
  if (!screenName) {
    throw new Error('Invalid parameters')
  }

  let user: types.UserEntity | null = null
  const users = getEntities().users.entities
  const userEntities: types.UserEntity[] = Object.values(users)

  for (const value of userEntities) {
    const nameLowered = value.screen_name.toLowerCase()
    const screenNameLowered = screenName.toLowerCase()
    if (nameLowered === screenNameLowered) {
      user = value
      break
    }
  }

  if (!user) {
    throw new Error('User not found')
  }

  let response: types.UserDetails = {}

  /**
   * We're explicitly checking that these properties both
   * exist, and have the expected type before adding them
   * to our response object.
   */

  if (typeof user.id_str === 'string') {
    response.id_str = user.id_str
  }

  if (typeof user.profile_image_url_https === 'string') {
    response.profile_image_url_https = user.profile_image_url_https
  }

  return response
}
