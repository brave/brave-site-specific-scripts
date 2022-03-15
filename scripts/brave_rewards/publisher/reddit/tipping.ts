/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MediaMetaData } from '../common/types'
import { getPort } from '../common/messaging'

import * as commonUtils from '../common/utils'
import * as locale from '../common/locale'
import * as styles from '../common/styles'

import * as types from './types'
import * as utils from './utils'

const maxPostLength = 200

let timeout: any = null

const getTipMediaMetaDataForOldReddit = async (post: Element) => {
  if (!post) {
    throw new Error('Invalid parameters')
  }

  let postText = ''
  const postTitleElement: HTMLAnchorElement | null =
    post.querySelector('a[data-event-action="title"]')
  const postTextElements = post.getElementsByClassName('md')

  if (!postTextElements || postTextElements.length === 0) {
    postText =
      postTitleElement && postTitleElement.innerText ?
      postTitleElement.innerText : ''
  } else {
    const divPostTextElement = (postTextElements[0] as HTMLDivElement)
    if (divPostTextElement && divPostTextElement.innerText) {
      postText = divPostTextElement.innerText
    }
  }

  if (postText.length > maxPostLength) {
    postText = postText.substr(0, maxPostLength) + '...'
  }

  let screenName = ''

  // It's possible for two author classes to show up on a comments
  // feed, the post author and a commenting author. Get 'entry' div
  // first to id the commenting author.
  let authorAnchorElement
  const entryDiv = post.getElementsByClassName('entry')
  if (entryDiv) {
    authorAnchorElement = entryDiv[0].getElementsByClassName('author')
  }

  if (authorAnchorElement && authorAnchorElement.length > 0) {
    const divPostTextElement = (authorAnchorElement[0] as HTMLAnchorElement)
    if (divPostTextElement && divPostTextElement.textContent) {
      screenName = divPostTextElement.textContent
    }
  }

  let postRelativeDate = ''
  const postDateElement = post.getElementsByTagName('time')
  if (postDateElement && postDateElement.length > 0) {
    postRelativeDate = postDateElement[0].textContent || ''
  }

  const response = await utils.getProfileUrlResponse(screenName, true)
  return {
    user: {
      id: utils.getUserIdFromResponse(response),
      screenName: screenName,
      fullName: utils.getPublisherNameFromResponse(response),
      favIconUrl: utils.getProfileImageUrlFromResponse(response)
    },
    post: {
      id: '',
      timestamp: postRelativeDate,
      text: postText || ''
    }
  }
}

const getTipMediaMetaData = async (post: Element) => {
  if (!post) {
    throw new Error('Invalid parameters')
  }

  let postText = ''
  let postTextElements = post.getElementsByTagName('p')
  if (!postTextElements || postTextElements.length === 0) {
    postTextElements = post.getElementsByTagName('h3')
    if (postTextElements && postTextElements.length > 0) {
      if (postTextElements[0].innerText) {
        postText = postTextElements[0].innerText
      }
    } else {
      postTextElements = post.getElementsByTagName('h1')
      if (postTextElements &&
          postTextElements.length > 0 &&
          postTextElements[0].innerText) {
        postText = postTextElements[0].innerText
      }
    }
  } else {
    const postTextElement = (postTextElements[0] as HTMLElement).parentElement
    if (postTextElement && postTextElement.innerText) {
      postText = postTextElement.innerText
    }
  }

  if (postText.length > maxPostLength) {
    postText = postText.substr(0, maxPostLength) + '...'
  }

  let screenName = ''
  const selector = 'a[href^="/user/"]:not([data-click-id="body"]):not([data-click-id="subreddit"])'
  const anchors = post.querySelectorAll(selector)
  for (const anchor of anchors) {
    if (anchor && anchor.textContent) {
      screenName =
        anchor.textContent.startsWith('u/') ?
        anchor.textContent.split('/')[1] : anchor.textContent
      break
    }
  }

  let postRelativeDate = ''
  const postDateElement = post.querySelector('a[data-click-id="timestamp"]')
  if (postDateElement) {
    postRelativeDate = postDateElement.textContent || ''
  } else {
    const commentPartElement = post.querySelector('div[data-test-id="comment"]')
    if (commentPartElement) {
      const authorRowDiv = commentPartElement.previousElementSibling
      if (authorRowDiv) {
        const timeLink = authorRowDiv.getElementsByTagName('a')
        if (timeLink && timeLink.length > 1) {
          const timeSpan = timeLink[1].getElementsByTagName('span')
          if (timeSpan && timeSpan.length > 0) {
            postRelativeDate = timeSpan[0].textContent || ''
          }
        }
      }
    }
  }

  const response = await utils.getProfileUrlResponse(screenName, false)
  return {
    user: {
      id: utils.getUserIdFromResponse(response),
      screenName: screenName,
      fullName: utils.getPublisherNameFromResponse(response),
      favIconUrl: utils.getProfileImageUrlFromResponse(response)
    },
    post: {
      id: '',
      timestamp: postRelativeDate,
      text: postText || ''
    }
  }
}

const createTipButtonForOldReddit = () => {
  const text = locale.getMessage('redditTipsIconLabel')
  if (!text) {
    return null
  }

  const tipButton = document.createElement('a')
  tipButton.className = 'reddit-actionButton'
  tipButton.href = 'javascript:void(0)'
  tipButton.textContent = text

  return tipButton
}

const createTipButton = () => {
  const tipButton = document.createElement('button')
  tipButton.className = 'reddit-actionButton'
  tipButton.style.display = 'inline-block'
  tipButton.style.transition = 'color 0.1s ease 0s'
  tipButton.style.background = 'transparent'
  tipButton.style.border = 'none'
  tipButton.style.color = 'inherit'
  tipButton.style.cursor = 'pointer'
  tipButton.style.padding = '2px 10px 0 10px'
  tipButton.style.borderRadius = '2px'
  tipButton.style.outline = 'none'
  tipButton.type = 'button'

  const style = document.createElement('style')
  const css = '.reddit-actionButton {}'
  style.appendChild(document.createTextNode(css))
  tipButton.appendChild(style)

  return tipButton
}

const createIconContainer = () => {
  const tipIconContainer = document.createElement('div')
  tipIconContainer.className = 'IconContainer'
  tipIconContainer.style.display = 'inline-block'
  tipIconContainer.style.marginBottom = '-2px'
  tipIconContainer.style.position = 'relative'
  tipIconContainer.style.verticalAlign = 'middle'

  return tipIconContainer
}

const createTipAction = (isPost: boolean) => {
  const tipAction = document.createElement('div')
  tipAction.className = 'action-brave-tip'

  if (isPost) {
    tipAction.style.display = 'flex'
    tipAction.style.height = '25px'
    tipAction.style.outline = 'none'
    tipAction.style.borderRadius = '2px'
  }

  tipAction.setAttribute(
    'data-original-title',
    locale.getMessage('redditTipsHoverText'))

  return tipAction
}

const createTipActionForOldReddit = () => {
  const tipAction = document.createElement('li')
  tipAction.className = 'action-brave-tip'

  return tipAction
}

const createTipIcon = () => {
  const tipIcon = document.createElement('span')
  tipIcon.className = 'tip-icon--medium'
  tipIcon.style.background = 'transparent'
  tipIcon.style.content = styles.getTippingIconDataURL()
  tipIcon.style.display = 'inline-block'
  tipIcon.style.fontSize = '18px'
  tipIcon.style.fontStyle = 'normal'
  tipIcon.style.height = '16px'
  tipIcon.style.position = 'relative'
  tipIcon.style.verticalAlign = 'baseline'
  tipIcon.style.width = '16px'

  return tipIcon
}

const createTipActionCount = () => {
  const tipActionCount = document.createElement('span')
  tipActionCount.className = 'reddit-actionCount'
  tipActionCount.style.color = 'inherit'
  tipActionCount.style.display = 'inline-block'
  tipActionCount.style.fontSize = '12px'
  tipActionCount.style.fontWeight = 'bold'
  tipActionCount.style.lineHeight = '1'
  tipActionCount.style.marginLeft = '3px'
  tipActionCount.style.position = 'relative'
  tipActionCount.style.verticalAlign = 'text-bottom'

  return tipActionCount
}

const createTipActionCountPresentation = () => {
  const text = locale.getMessage('redditTipsIconLabel')
  if (!text) {
    return null
  }

  const tipActionCountPresentation = document.createElement('span')
  tipActionCountPresentation.className = 'reddit-actionButton'
  tipActionCountPresentation.textContent = text

  return tipActionCountPresentation
}

const createHoverStyleElement = (isPost: boolean) => {
  const style = document.createElement('style')
  const css = isPost ? ':host { outline: none } :host(:hover) { background-color: var(--newRedditTheme-navIconFaded10) }' : '.reddit-actionButton { text-decoration: none; color: var(--newCommunityTheme-actionIcon); font-weight: bold; padding: 0px 1px; } .reddit-actionButton:hover { color: var(--newCommunityTheme-bodyText); text-decoration: underline }'
  style.appendChild(document.createTextNode(css))
  return style
}

const createHoverStyleElementForOldReddit = () => {
  const style = document.createElement('style')
  const css = '.reddit-actionButton { color: #888; font-weight: bold; paddings: 0 1px; text-decoration: none } .reddit-actionButton:hover { text-decoration: underline }'
  style.appendChild(document.createTextNode(css))

  return style
}

const getMoreActionCommentElement = (commentElement: Element) => {
  if (!commentElement) {
    return null
  }

  return commentElement.querySelector('button[aria-label="more options"]')
}

const getMoreActionPostElement = (postElement: Element) => {
  const element = postElement.querySelector('button[aria-label="more options"]')
  if (!element) {
    return null
  }

  return !element.nextElementSibling &&
         !element.previousElementSibling &&
         element.parentElement ? element.parentElement : element
}

const getSaveElement = (commentElement: Element) => {
  return document.evaluate(
    ".//button[text()='Save']",
    commentElement,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null).singleNodeValue as HTMLElement | null
}

const getPromotedSaveElement = (element: Element) => {
  const saveElement = document.evaluate(
    ".//span[text()='save']",
    element,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null).singleNodeValue as HTMLElement
  if (!saveElement ||
      !saveElement.parentElement ||
      !saveElement.parentElement.parentElement) {
    return null
  }

  return saveElement.parentElement.parentElement
}

const isUsersOwnPost = (commentElement: Element) => {
  return Boolean(document.evaluate(
    ".//button[text()='edit']",
    commentElement,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null).singleNodeValue)
}

const createElementTipActionForOldReddit = (post: Element) => {
  // Create the tip action
  const tipAction = createTipActionForOldReddit()

  // Create a container that is eligible to attach shadow DOM
  const tipActionContainer = document.createElement('span')
  tipAction.appendChild(tipActionContainer)

  const tipIconContainer = createIconContainer()

  const tipIcon = createTipIcon()
  tipIconContainer.appendChild(tipIcon)

  // Create the tip button
  const tipButton = createTipButtonForOldReddit()
  if (!tipButton) {
    return null
  }

  tipButton.appendChild(tipIconContainer)
  tipButton.onclick = function (event) {
    event.stopPropagation()
    return getTipMediaMetaDataForOldReddit(post)
      .then((mediaMetaData) => {
        if (mediaMetaData) {
          tipUser(mediaMetaData)
        }
      })
  }

  const shadowRoot = tipActionContainer.attachShadow({ mode: 'open' })
  shadowRoot.appendChild(tipIconContainer)
  shadowRoot.appendChild(tipButton)
  shadowRoot.appendChild(createHoverStyleElementForOldReddit())

  return tipAction
}

const createElementTipAction = (post: Element, isPost: boolean) => {
  // Create the tip action
  const tipAction = createTipAction(isPost)

  // Create the tip button
  const tipButton = createTipButton()

  // Create button event
  tipButton.onclick = function (event) {
    event.stopPropagation()
    return getTipMediaMetaData(post)
      .then((mediaMetaData) => {
        if (mediaMetaData) {
          tipUser(mediaMetaData)
        }
      })
  }

  // Create the tip icon container
  const tipIconContainer = createIconContainer()
  tipButton.appendChild(tipIconContainer)

  // Create the tip icon
  const tipIcon = createTipIcon()
  tipIconContainer.appendChild(tipIcon)

  // Create the tip action count
  const tipActionCount = createTipActionCount()
  tipButton.appendChild(tipActionCount)

  // Create the tip action count presentation
  const tipActionCountPresentation = createTipActionCountPresentation()
  if (!tipActionCountPresentation) {
    return null
  }

  tipActionCount.appendChild(tipActionCountPresentation)

  // Create the shadow DOM root
  const shadowRoot = tipAction.attachShadow({ mode: 'open' })
  shadowRoot.appendChild(tipButton)

  const hoverStyleElement = createHoverStyleElement(isPost)
  shadowRoot.appendChild(hoverStyleElement)

  return tipAction
}

const configureForSaveElement = (
  element: Element,
  saveElement: Element,
  config: any
) => {
  if (!element || !saveElement || !config) {
    return
  }

  const tipAction = createElementTipAction(element, config.posts)
  if (tipAction) {
    saveElement.insertAdjacentElement('afterend', tipAction)
  }
}

const configureForMoreInfoElement = (
  element: Element,
  lastElement: Element,
  config: any
) => {
  if (!element || !lastElement || !config) {
    return
  }

  if (!config.usersPost && !config.posts) {
    const tipAction = createElementTipAction(element, false)
    if (tipAction) {
      lastElement.insertAdjacentElement('beforebegin', tipAction)
    }
  } else if (lastElement.parentElement) {
    const tipAction = createElementTipAction(element, config.posts)
    if (tipAction) {
      lastElement.parentElement.insertAdjacentElement('beforebegin', tipAction)
    }
  }
}

const configureForPosts = (config: any) => {
  if (!config) {
    return
  }

  // Special case: use this for promoted content when user isn't logged in
  const postElements =
    config.posts ?
    document.getElementsByClassName('Post') :
    document.getElementsByClassName('Comment')
  if (!postElements) {
    return
  }

  for (const postElement of postElements) {
    const isUsersPost = isUsersOwnPost(postElement)
    const actions = postElement.querySelectorAll('div.action-brave-tip')
    const inEditModeElements = postElement.
      querySelector('div[data-test-id="comment-submission-form-richtext"')
    if (actions.length > 0 || inEditModeElements) {
      continue
    }

    const saveElement =
      config.promotedPosts ?
      getPromotedSaveElement(postElement) :
      getSaveElement(postElement)
    if (saveElement) {
      configureForSaveElement(postElement, saveElement, config)
    } else {
      const moreElement = config.posts ?
        getMoreActionPostElement(postElement) :
        getMoreActionCommentElement(postElement)
      if (moreElement) {
        const moreInfoConfig = { posts: config.posts, usersPost: isUsersPost }
        configureForMoreInfoElement(postElement, moreElement, moreInfoConfig)
      }
    }
  }
}

const configureForOldReddit = (postType: string) => {
  const elements = document.querySelectorAll(`div[data-type="${postType}"]`)
  if (!elements) {
    return
  }

  for (const element of elements) {
    const actions = element.querySelectorAll('li.action-brave-tip')
    if (actions.length > 0) {
      continue
    }

    const ulElement = element.getElementsByClassName('flat-list')
    if (ulElement.length === 0) {
      continue
    }

    const tipAction = createElementTipActionForOldReddit(element)
    if (tipAction) {
      ulElement[0].insertAdjacentElement('beforeend', tipAction)
    }
  }
}

const tipUser = (mediaMetaData: MediaMetaData) => {
  const port = getPort()
  if (!port) {
    return
  }

  const publisherKey =
    commonUtils.buildPublisherKey(types.mediaType, mediaMetaData.user.id)
  const publisherName = mediaMetaData.user.fullName
  const publisherScreenName = mediaMetaData.user.screenName

  // Regardless of this being old or new reddit we want to
  // canonicalize the url as https://reddit.com/ on the server,
  // so pass false here
  const profileUrl = utils.buildProfileUrl(mediaMetaData.user.screenName, false)

  port.postMessage({
    type: 'TipUser',
    mediaType: types.mediaType,
    data: {
      url: profileUrl,
      publisherKey,
      publisherName,
      publisherScreenName,
      favIconUrl: mediaMetaData.user.favIconUrl,
      postId: mediaMetaData.post.id,
      postTimestamp: mediaMetaData.post.timestamp,
      postText: mediaMetaData.post.text
    }
  })
}

export const configure = () => {
  clearTimeout(timeout)

  const isOldReddit = utils.isOldRedditUrl(new URL(location.href))

  if (isOldReddit) {
    // Comments, replies, etc.
    configureForOldReddit('comment')

    // Initial posts, etc.
    configureForOldReddit('link')
  } else {
    // Comments, replies, etc.
    configureForPosts({ posts: false, promotedPosts: false })

    // Initial posts
    configureForPosts({ posts: true, promotedPosts: false })

    // Promoted posts (on feeds)
    configureForPosts({ posts: true, promotedPosts: true })
  }

  timeout = setTimeout(configure, 3000)
}
