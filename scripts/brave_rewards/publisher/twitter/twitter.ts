/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as auth from './auth'
import * as commonTypes from '../common/types'
import * as commonUtils from '../common/utils'
import * as types from './types'
import * as utils from './utils'

const sendHeadersUrls = [ 'https://api.twitter.com/1.1/*' ]
const sendHeadersExtra = [ 'requestHeaders', 'extraHeaders' ]

let port: chrome.runtime.Port | null = null

let registeredOnSendHeadersWebRequest = false

let registeredOnUpdatedTab = false

let configureTipActionTimeout: any = null

let credentialHeaders = {}

let newTwitter = true

interface MediaMetaData {
  user: {
    id: string
    screenName: string
    fullName: string
    favIconUrl: string
  }
  post: {
    id: string
    timestamp: string
    text: string
  }
}

// Remove when https://github.com/brave/brave-browser/issues/11890 is resolved
const getMessage = (id: string) => {
  switch (id) {
    case 'twitterTipsHoverText':
      return 'Tip this tweet'
    case 'twitterTipsIconLabel':
      return 'Tip'
  }

  return ''
}

const sendAPIRequest = (name: string, url: string) => {
  return new Promise((resolve, reject) => {
    if (!name || !url) {
      reject(new Error('Invalid parameters'))
      return
    }

    if (Object.keys(credentialHeaders).length === 0) {
      reject(new Error('Missing credential headers'))
      return
    }

    if (!port) {
      reject(new Error('Invalid port'))
      return
    }

    port.postMessage({
      type: 'OnAPIRequest',
      mediaType: types.mediaType,
      data: {
        name,
        url,
        init: {
          credentials: 'include',
          headers: {
            ...credentialHeaders
          },
          referrerPolicy: 'no-referrer-when-downgrade',
          method: 'GET',
          redirect: 'follow'
        }
      }})

    port.onMessage.addListener(function onMessageListener(msg) {
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
          return
        }
      }
    })
  })
}

const getTweetDetails = async (tweetId: string) => {
  if (!tweetId) {
    return Promise.reject(new Error('Invalid parameters'))
  }

  const url = `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}`
  return sendAPIRequest('GetTweetDetails', url)
}

const getUserDetails = async (screenName: string) => {
  if (!screenName) {
    return Promise.reject(new Error('Invalid parameters'))
  }

  const url = `https://api.twitter.com/1.1/users/show.json?screen_name=${screenName}`
  return sendAPIRequest('GetUserDetails', url)
}

const getMediaMetaData = (tweet: Element, tweetId: string): Promise<MediaMetaData> => {
  if (!tweet || !tweetId) {
    return Promise.reject(new Error('Invalid parameters'))
  }

  return getTweetDetails(tweetId)
    .then((details: any) => {
      return {
        user: {
          id: details.user.id_str,
          screenName: details.user.screen_name,
          fullName: details.user.name,
          favIconUrl: details.user.profile_image_url_https.replace('_normal', '')
        },
        post: {
          id: tweetId,
          timestamp: details.created_at,
          text: details.text
        }
      }
    })
    .catch((error: any) => {
      console.error(`Failed to fetch tweet details for ${tweetId}: ${error.message}`)
      return Promise.reject(error)
    })
}

const getMediaMetaDataForOldTwitter = (tweet: Element, tweetId: string): MediaMetaData | null => {
  if (!tweet) {
    return null
  }

  const tweetTextElements = tweet.getElementsByClassName('tweet-text')
  if (!tweetTextElements || tweetTextElements.length === 0) {
    return null
  }

  const tweetText = tweetTextElements[0] as HTMLElement

  const tweetTimestampElements = tweet.getElementsByClassName('js-short-timestamp')
  if (!tweetTimestampElements || tweetTimestampElements.length === 0) {
    return null
  }

  const tweetTimestamp = tweetTimestampElements[0].getAttribute('data-time') || ''

  return {
    user: {
      id: tweet.getAttribute('data-user-id') || '',
      screenName: tweet.getAttribute('data-screen-name') || '',
      fullName: tweet.getAttribute('data-name') || '',
      favIconUrl: ''
    },
    post: {
      id: tweetId,
      timestamp: tweetTimestamp,
      text: tweetText.innerText || ''
    }
  }
}

const onTipActionKey = (e: KeyboardEvent) => {
  if (e.key !== 'Enter' && e.code !== 'Space') {
    return
  }

  const activeItem = e.target as HTMLElement
  if (!activeItem) {
    return
  }

  const shadowRoot = activeItem.shadowRoot
  if (!shadowRoot) {
    return
  }

  const tipButton: HTMLElement | null = shadowRoot.querySelector('.js-actionButton')
  if (tipButton) {
    tipButton.click()
  }
}

const isThreadParent = (tweet: Element) => {
  if (!tweet || !location.pathname.includes('/status/')) {
    return false
  }

  const threadParent = tweet.querySelector("a[href*='how-to-tweet']")
  if (!threadParent) {
    return false
  }

  return true
}

const createTipAction = (tweet: Element, tweetId: string, hasUserActions: boolean) => {
  // Create the tip action
  const tipAction = document.createElement('div')
  tipAction.className = 'ProfileTweet-action js-tooltip action-brave-tip'
  tipAction.style.display = 'inline-block'
  tipAction.style.minWidth = '80px'
  tipAction.style.textAlign = hasUserActions ? 'right' : 'start'
  tipAction.setAttribute('role', 'button')
  tipAction.setAttribute('tabindex', '0')
  tipAction.setAttribute('data-original-title', getMessage('twitterTipsHoverText'))
  tipAction.addEventListener('keydown', onTipActionKey)

  // Create the tip button
  const tipButton = document.createElement('button')
  tipButton.className = 'ProfileTweet-actionButton u-textUserColorHover js-actionButton'
  tipButton.style.background = 'transparent'
  tipButton.style.border = '0'
  tipButton.style.color = '#657786'
  tipButton.style.cursor = 'pointer'
  tipButton.style.display = 'inline-block'
  tipButton.style.fontSize = '16px'
  tipButton.style.lineHeight = '1'
  tipButton.style.outline = '0'
  tipButton.style.padding = '0 2px'
  tipButton.style.position = 'relative'
  tipButton.type = 'button'
  tipButton.onclick = function (event) {
    if (newTwitter) {
      getMediaMetaData(tweet, tweetId)
        .then((mediaMetaData: MediaMetaData) => {
          if (mediaMetaData) {
            tipUser(mediaMetaData)
          }
        })
        .catch((error: any) => {
          console.error(`Failed to fetch tweet metadata for ${tweet}:`, error)
        })
    } else {
      const mediaMetaData = getMediaMetaDataForOldTwitter(tweet, tweetId)
      if (mediaMetaData) {
        tipUser(mediaMetaData)
      }
    }
    event.stopPropagation()
  }

  // Thread parents require a slightly larger margin due to layout differences
  if (newTwitter && tweet && isThreadParent(tweet)) {
    tipButton.style.marginTop = '12px'
  }

  // Create the tip icon container
  const tipIconContainer = document.createElement('div')
  tipIconContainer.className = 'IconContainer js-tooltip'
  tipIconContainer.style.display = 'inline-block'
  tipIconContainer.style.lineHeight = '0'
  tipIconContainer.style.position = 'relative'
  tipIconContainer.style.verticalAlign = 'middle'
  tipButton.appendChild(tipIconContainer)

  // Create the tip icon
  const tipIcon = document.createElement('span')
  tipIcon.className = 'Icon Icon--medium'
  tipIcon.style.background = 'transparent'
  tipIcon.style.content = 'url(\'data:image/svg+xml;utf8,<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 105 100" style="enable-background:new 0 0 105 100;" xml:space="preserve"><style type="text/css">.st1{fill:%23662D91;}.st2{fill:%239E1F63;}.st3{fill:%23FF5000;}.st4{fill:%23FFFFFF;stroke:%23FF5000;stroke-width:0.83;stroke-miterlimit:10;}</style><title>BAT_icon</title><g id="Layer_2_1_"><g id="Layer_1-2"><polygon class="st1" points="94.8,82.6 47.4,55.4 0,82.9 "/><polygon class="st2" points="47.4,0 47.1,55.4 94.8,82.6 "/><polygon class="st3" points="0,82.9 47.2,55.9 47.4,0 "/><polygon class="st4" points="47.1,33.7 28,66.5 66.7,66.5 "/></g></g></svg>\')'
  tipIcon.style.display = 'inline-block'
  tipIcon.style.fontSize = '18px'
  tipIcon.style.fontStyle = 'normal'
  tipIcon.style.height = '16px'
  tipIcon.style.marginTop = '5px'
  tipIcon.style.position = 'relative'
  tipIcon.style.verticalAlign = 'baseline'
  tipIcon.style.width = '16px'
  tipIconContainer.appendChild(tipIcon)

  // Create the tip action count (typically used to present a counter
  // associated with the action, but we'll use it to display a static
  // action label)
  const tipActionCount = document.createElement('span')
  tipActionCount.className = 'ProfileTweet-actionCount'
  tipActionCount.style.color = '#657786'
  tipActionCount.style.display = 'inline-block'
  tipActionCount.style.fontSize = '12px'
  tipActionCount.style.fontWeight = 'bold'
  tipActionCount.style.lineHeight = '1'
  tipActionCount.style.marginLeft = '6px'
  tipActionCount.style.position = 'relative'
  tipActionCount.style.verticalAlign = 'text-bottom'
  tipButton.appendChild(tipActionCount)

  // Create the tip action count presentation
  const tipActionCountPresentation = document.createElement('span')
  tipActionCountPresentation.className = 'ProfileTweet-actionCountForPresentation'
  tipActionCountPresentation.textContent = getMessage('twitterTipsIconLabel')
  tipActionCount.appendChild(tipActionCountPresentation)

  // Create the shadow DOM root that hosts our injected DOM elements
  const shadowRoot = tipAction.attachShadow({ mode: 'open' })
  shadowRoot.appendChild(tipButton)

  // Create style element for hover color
  const style = document.createElement('style')
  const css = '.ProfileTweet-actionButton :hover { color: #FB542B }'
  style.appendChild(document.createTextNode(css))
  shadowRoot.appendChild(style)

  return tipAction
}

const configureTipAction = () => {
  clearTimeout(configureTipActionTimeout)

  // Reset page state since first run of this function may have
  // been pre-content
  newTwitter = true

  let tweets = document.querySelectorAll('[role="article"]')
  if (tweets.length === 0) {
    tweets = document.querySelectorAll('.tweet')
    newTwitter = false
  }

  for (let i = 0; i < tweets.length; ++i) {
    const tweetId = utils.getTweetId(tweets[i], newTwitter)
    if (!tweetId) {
      continue
    }

    let actions

    if (newTwitter) {
      actions = tweets[i].querySelector('[role="group"]')
    } else {
      actions = tweets[i].querySelector('.js-actions')
    }

    if (!actions) {
      continue
    }

    const braveTipActions = actions.getElementsByClassName('action-brave-tip')

    if (braveTipActions.length === 0) {
      const numActions = actions.querySelectorAll(':scope > div').length || 0
      const hasUserActions = numActions > 3
      const tipAction = createTipAction(tweets[i], tweetId, hasUserActions)
      actions.appendChild(tipAction)
    }
  }

  configureTipActionTimeout = setTimeout(configureTipAction, 3000)
}

const handleOnSendHeadersWebRequest = (mediaType: string, details: any) => {
  if (mediaType !== types.mediaType || !details || !details.requestHeaders) {
    return
  }

  const authHeaders = auth.processRequestHeaders(details.requestHeaders)
  if (commonUtils.areObjectsEqualShallow(authHeaders, credentialHeaders)) {
    return
  }

  credentialHeaders = authHeaders

  sendPublisherInfo()
  configureTipAction()
}

const handleOnUpdatedTab = (changeInfo: any) => {
  if (!changeInfo || !changeInfo.url) {
    return
  }

  sendPublisherInfo()
}

const registerOnSendHeadersWebRequest = () => {
  if (registeredOnSendHeadersWebRequest) {
    return
  }

  registeredOnSendHeadersWebRequest = true

  if (!port) {
    return
  }

  port.postMessage({
    type: 'RegisterOnSendHeadersWebRequest',
    mediaType: types.mediaType,
    data: {
      urlPatterns: sendHeadersUrls,
      extra: sendHeadersExtra
    }
  })

  port.onMessage.addListener(function (msg) {
    if (!msg.data) {
      return
    }
    switch (msg.type) {
      case 'OnSendHeadersWebRequest': {
        handleOnSendHeadersWebRequest(msg.mediaType, msg.data.details)
        break
      }
    }
  })
}

const registerOnUpdatedTab = () => {
  if (registeredOnUpdatedTab) {
    return
  }

  registeredOnUpdatedTab = true

  if (!port) {
    return
  }

  port.postMessage({
    type: 'RegisterOnUpdatedTab',
    mediaType: types.mediaType,
  })

  port.onMessage.addListener(function (msg) {
    if (!msg.data) {
      return
    }
    switch (msg.type) {
      case 'OnUpdatedTab': {
        handleOnUpdatedTab(msg.data.changeInfo)
        break
      }
    }
  })
}

const sendPublisherInfoForExcludedPage = () => {
  const url = `https://${types.mediaDomain}`
  const publisherKey = types.mediaDomain
  const publisherName = types.mediaDomain
  const mediaKey = ''
  const favIconUrl = ''

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

const sendPublisherInfoForStandardPage = (url: URL) => {
  const screenName = utils.getScreenNameFromUrl(url)
  if (!screenName) {
    return
  }

  getUserDetails(screenName)
    .then((userDetails: any) => {
      const userId = userDetails.id_str
      const publisherKey = utils.buildPublisherKey(userId)
      const publisherName = screenName
      const mediaKey = ''
      const favIconUrl = userDetails.profile_image_url_https.replace('_normal', '')

      const profileUrl = utils.buildProfileUrl(screenName, userId)

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
    })
    .catch(error => {
      console.error(`Failed to fetch user details for ${screenName}: ${error.message}`)
    })
}

const sendPublisherInfo = () => {
  const url = new URL(location.href)
  if (utils.isExcludedPath(url.pathname)) {
    sendPublisherInfoForExcludedPage()
  } else {
    sendPublisherInfoForStandardPage(url)
  }
}

const tipUser = (mediaMetaData: MediaMetaData) => {
  if (!mediaMetaData) {
    return
  }

  const profileUrl = utils.buildProfileUrl(mediaMetaData.user.screenName, mediaMetaData.user.id)
  const publisherKey = utils.buildPublisherKey(mediaMetaData.user.id)
  const publisherName = mediaMetaData.user.screenName

  if (!port) {
    return
  }

  port.postMessage({
    type: 'TipUser',
    mediaType: types.mediaType,
    data: {
      url: profileUrl,
      publisherKey,
      publisherName,
      favIconUrl: mediaMetaData.user.favIconUrl,
      postId: mediaMetaData.post.id,
      postTimestamp: mediaMetaData.post.timestamp,
      postText: mediaMetaData.post.text
    }
  })
}

const initScript = () => {
  // Don't run in incognito context
  if (chrome.extension.inIncognitoContext) {
    return
  }

  port = chrome.runtime.connect(commonTypes.braveRewardsExtensionId, { name: 'Greaselion' })

  // Send publisher info and configure tip action on visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      console.debug('visibilitychange event triggered')
      sendPublisherInfo()
      configureTipAction()
    }
  })

  registerOnSendHeadersWebRequest()
  registerOnUpdatedTab()

  console.info('Greaselion script loaded: twitter.ts')
}

initScript()
