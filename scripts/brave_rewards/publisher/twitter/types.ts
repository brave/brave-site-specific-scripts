/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

export const mediaType = 'twitter'
export const mediaDomain = 'twitter.com'

export const sendHeadersUrls = ['https://api.twitter.com/1.1/*']
export const sendHeadersExtra = ['requestHeaders', 'extraHeaders']

export type TweetDetails = {
  user?: {
    id_str?: string
    screen_name?: string
    name?: string
    profile_image_url_https?: string
  }
  created_at?: string
  text?: string
}

export type UserDetails = {
  id_str?: string
  profile_image_url_https?: string
}

export type UserEntity = {
  screen_name: string
  id_str: string
  profile_image_url_https: string
}

export type UserEntities = {
  [key: string]: UserEntity
}
