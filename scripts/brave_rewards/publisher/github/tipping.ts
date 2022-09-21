/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getPort } from '../common/messaging'
import { MediaMetaData } from '../common/types'

import * as commonUtils from '../common/utils'
import * as styles from '../common/styles'

import * as types from './types'
import * as utils from './utils'

const actionTipClass = 'action-brave-tip'
const tipActionCountClass = 'GitHubTip-actionCount'
const tipIconContainerClass = 'IconContainer'

let timeout: any = null

const tipUser = (mediaMetaData: MediaMetaData) => {
  if (!mediaMetaData) {
    return
  }

  const profileUrl = utils.buildProfileUrl(mediaMetaData.user.screenName)
  const publisherKey =
    commonUtils.buildPublisherKey(types.mediaType, mediaMetaData.user.id)
  const publisherName = mediaMetaData.user.fullName
  const publisherScreenName = mediaMetaData.user.screenName

  const port = getPort()
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
      publisherScreenName,
      favIconUrl: mediaMetaData.user.favIconUrl,
      postId: mediaMetaData.post.id,
      postTimestamp: mediaMetaData.post.timestamp,
      postText: mediaMetaData.post.text
    }
  })
}

const createTipAction = (
  elem: Element,
  getMetaData: (elem: Element) => Promise<MediaMetaData>
) => {
  // Create the tip action
  const tipAction = document.createElement('div')
  tipAction.className = 'GitHubTip-action js-tooltip ' + actionTipClass
  tipAction.style.display = 'inline-block'
  tipAction.style.minWidth = '40px'

  const tipActionHoverText = chrome.i18n.getMessage('githubTipsHoverText')
  if (tipActionHoverText) {
    tipAction.className += ' tooltipped tooltipped-sw'
    tipAction.setAttribute('aria-label', tipActionHoverText)
  }

  // Create the tip button
  const tipButton = document.createElement('button')
  tipButton.className =
    'GitHubTip-actionButton u-textUserColorHover js-actionButton'
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
    event.stopPropagation()
    return getMetaData(elem)
      .then((mediaMetaData) => {
        if (mediaMetaData) {
          tipUser(mediaMetaData)
        }
      })
  }

  // Create the tip icon container
  const tipIconContainer = document.createElement('div')
  tipIconContainer.className = tipIconContainerClass + ' js-tooltip'
  tipIconContainer.style.display = 'inline-block'
  tipIconContainer.style.lineHeight = '0'
  tipIconContainer.style.position = 'relative'
  tipIconContainer.style.verticalAlign = 'middle'
  tipButton.appendChild(tipIconContainer)

  // Create the tip icon
  const tipIcon = document.createElement('span')
  tipIcon.className = 'Icon Icon--medium'
  tipIcon.style.background = 'transparent'
  tipIcon.style.content = styles.getTippingIconDataURL()
  tipIcon.style.display = 'inline-block'
  tipIcon.style.fontSize = '18px'
  tipIcon.style.fontStyle = 'normal'
  tipIcon.style.height = '16px'
  tipIcon.style.marginTop = '3px'
  tipIcon.style.position = 'relative'
  tipIcon.style.verticalAlign = 'baseline'
  tipIcon.style.width = '16px'
  tipIconContainer.appendChild(tipIcon)

  // Create the tip action count (typically used to present a counter
  // associated with the action, but we'll use it to display a static
  // action label)
  const tipActionCount = document.createElement('span')
  tipActionCount.className = tipActionCountClass
  tipActionCount.style.color = '#657786'
  tipActionCount.style.display = 'inline-block'
  tipActionCount.style.fontSize = '12px'
  tipActionCount.style.fontWeight = 'bold'
  tipActionCount.style.lineHeight = '1'
  tipActionCount.style.marginLeft = '1px'
  tipActionCount.style.position = 'relative'
  tipActionCount.style.verticalAlign = 'text-bottom'
  tipButton.appendChild(tipActionCount)

  // Create the tip action count presentation
  const tipActionCountPresentation = document.createElement('span')
  tipActionCountPresentation.className = 'GitHubTip-actionCountForPresentation'

  const tipActionCountPresentationLabel =
    chrome.i18n.getMessage('githubTipsIconLabel')
  if (tipActionCountPresentationLabel) {
    tipActionCountPresentation.textContent = tipActionCountPresentationLabel
  }

  tipActionCount.appendChild(tipActionCountPresentation)

  // Create the shadow DOM root that hosts our injected DOM elements
  const shadowRoot = tipAction.attachShadow({ mode: 'open' })
  shadowRoot.appendChild(tipButton)

  // Create style element for hover color
  const style = document.createElement('style')
  style.appendChild(document
    .createTextNode('.GitHubTip-actionButton :hover { color: #6781db }'))
  shadowRoot.appendChild(style)

  return tipAction
}

const getCommentMetaData = async (elem: Element) => {
  let ancestor = elem.closest('.timeline-comment-header')
  ancestor = ancestor || elem.closest('.review-comment')
  if (!ancestor) {
    throw new Error('Failed to parse DOM')
  }

  const authorStack = ancestor.getElementsByClassName('author')
  if (!authorStack || authorStack.length === 0) {
    throw new Error('Failed to parse DOM')
  }

  const author = authorStack[0] as HTMLElement
  const screenName = author.textContent
  if (!screenName) {
    throw new Error('Missing screen name')
  }

  return utils.getMediaMetaData(screenName)
}

const commentInsertFunction = (parent: Element) => {
  if (!parent) {
    return
  }

  const tipAction = createTipAction(parent, getCommentMetaData)
  if (!tipAction || !tipAction.shadowRoot) {
    return
  }

  tipAction.style.marginRight = '2px'

  const iconContainer = tipAction.shadowRoot
    .querySelector<HTMLElement>(`.${tipIconContainerClass}`)
  if (iconContainer) {
    iconContainer.style.paddingBottom = '5px'
  }

  const braveTipActionCount = tipAction.shadowRoot
    .querySelector<HTMLElement>(`.${tipActionCountClass}`)
  if (braveTipActionCount) {
    braveTipActionCount.style.paddingBottom = '2px'
  }

  const children = parent.childNodes
  if (!children || children.length < 2) {
    return
  }

  const end = children[children.length - 2]
  parent.insertBefore(tipAction, end)
}

const getCommitLinksMetaData = async (elem: Element) => {
  if (!elem) {
    throw new Error('Invalid arguments')
  }

  const avatarStack = elem.getElementsByClassName('avatar')
  if (!avatarStack || avatarStack.length === 0) {
    throw new Error('Failed to parse DOM')
  }

  const avatar = avatarStack[0] as HTMLElement
  if (!avatar) {
    throw new Error('Failed to parse DOM')
  }

  const avatarChildren = avatar.children
  if (!avatarChildren || avatarChildren.length === 0) {
    throw new Error('Failed to parse DOM')
  }

  const screenName = (avatarChildren[0] as HTMLImageElement).alt.slice(1)
  if (!screenName) {
    throw new Error('Missing screen name')
  }

  return utils.getMediaMetaData(screenName)
}

const commitLinksInsertFunction = (parent: Element) => {
  if (!parent) {
    return
  }

  const tipAction = createTipAction(parent, getCommitLinksMetaData)
  if (!tipAction) {
    return
  }

  tipAction.style.marginTop = '4px'
  tipAction.style.marginLeft = '9px'

  parent.appendChild(tipAction)
}

const getStarringContainerMetaData = async (elem: Element) => {
  if (!elem) {
    throw new Error('Invalid arguments')
  }

  const ancestor = elem.closest('.d-block')
  if (!ancestor) {
    throw new Error('Failed to parse DOM')
  }

  const anchors = ancestor.getElementsByTagName('A')
  if (!anchors || anchors.length === 0) {
    throw new Error('Failed to parse DOM')
  }

  const anchor = anchors[0] as HTMLAnchorElement
  if (!anchor.href) {
    throw new Error('Failed to parse DOM')
  }

  const components = anchor.href.split('/')
  if (components.length < 4) {
    throw new Error('Failed to parse DOM')
  }

  const screenName = components[3]
  if (!screenName) {
    throw new Error('Missing screen name')
  }

  return utils.getMediaMetaData(screenName)
}

const starringContainerInsertFunction = (parent: Element) => {
  if (!parent) {
    return
  }

  if (!utils.isAllowedTab(window.location.search)) {
    return
  }

  const elements = parent.getElementsByClassName('d-inline-block')
  if (!elements || elements.length === 0) {
    return
  }

  const tipAction = createTipAction(parent, getStarringContainerMetaData)

  tipAction.classList.add('d-inline-block')
  tipAction.style.minWidth = '60px'

  parent.insertBefore(tipAction, elements[0])
}

const getPageHeadMetaData = async (elem: Element) => {
  const elems = document.getElementsByClassName('gisthead')
  if (!elems || elems.length === 0) {
    throw new Error('Failed to parse DOM')
  }

  elem = elems[0]

  const authors = elem.getElementsByClassName('author')
  if (!authors || authors.length === 0) {
    throw new Error('Failed to parse DOM')
  }

  const author = authors[0]
  const anchors = author.getElementsByTagName('A')
  if (!anchors || anchors.length === 0) {
    throw new Error('Failed to parse DOM')
  }

  const anchor = anchors[0] as HTMLAnchorElement
  const screenName = anchor.textContent
  if (!screenName) {
    throw new Error('Missing screen name')
  }

  return utils.getMediaMetaData(screenName)
}

const pageheadInsertFunction = (parent: Element) => {
  if (!parent) {
    return
  }

  const components = window.location.host.split('.')
  if (!components || components.length < 1) {
    return
  }

  const subdomain = components[0]
  if (subdomain !== 'gist' ||
      window.location.pathname.slice(1).split('/').length < 2) {
    return
  }

  const tipAction = createTipAction(parent, getPageHeadMetaData)
  parent.appendChild(tipAction)
}

const getMemberListItemMetaData = async (elem: Element) => {
  if (!elem) {
    throw new Error('Invalid arguments')
  }

  const anchor = elem as HTMLAnchorElement
  if (!anchor.href) {
    throw new Error('Failed to parse DOM')
  }

  const pathname = anchor.href.replace('https://github.com', '')
  if (!pathname) {
    throw new Error('Failed to parse DOM')
  }

  const components = pathname.split('/').filter(item => item)
  if (components.length < 1) {
    throw new Error('Failed to parse DOM')
  }

  let screenName = ''

  if (components[0] === 'orgs') {
    screenName = components[components.length - 1]
  } else {
    screenName = components[0]
  }

  if (!screenName) {
    throw new Error('Missing screen name')
  }

  return utils.getMediaMetaData(screenName)
}

const memberListItemInsertFunction = (parent: Element) => {
  if (!parent || !parent.children || parent.children.length < 2) {
    return
  }

  const path = window.location.pathname
  const memberTextDiv = parent.children[1] as HTMLElement
  if (!memberTextDiv || !memberTextDiv.children.length || !path.startsWith('/orgs/')) {
    return
  }

  const memberText = memberTextDiv.children[0] as HTMLElement
  if (!memberText) {
    return
  }

  const tipAction =
    createTipAction(memberText as Element, getMemberListItemMetaData)

  tipAction.style.paddingLeft = '5px'

  if (path.split('/').includes('teams')) {
    // Special case, different styling for same element
    memberTextDiv.insertBefore(tipAction, memberTextDiv.children[1])
    tipAction.style.paddingLeft = '5px'
    tipAction.style.paddingRight = '12px'
    tipAction.style.verticalAlign = 'text-bottom'
  } else {
    const span = document.createElement('span')
    span.style.display = 'flex'
    memberTextDiv.insertBefore(span, memberText)
    span.appendChild(memberText)
    span.appendChild(tipAction)
  }
}

const configureTipAction = (
  tipLocationClass: string,
  insertFunction: (parent: Element) => void
) => {
  const tipLocations = document.getElementsByClassName(tipLocationClass)
  if (!tipLocations) {
    return
  }

  for (let i = 0; i < tipLocations.length; ++i) {
    const parent = tipLocations[i]
    if (!parent) {
      continue
    }

    const braveTipActions = parent.getElementsByClassName(actionTipClass)
    if (braveTipActions.length === 0) {
      insertFunction(parent)
    }
  }
}

export const configure = () => {
  clearTimeout(timeout)

  // Format: https://github.com/<user>/<repository>/pull/<pr_number>
  // Format: https://github.com/<user>/<repository>/issues/<issue_number>
  configureTipAction('timeline-comment-actions', commentInsertFunction)

  // Format: https://github.com/<user>/<repository>/commits/<branch_name>
  configureTipAction('js-commits-list-item', commitLinksInsertFunction)

  // Format: https://github.com/<user>?tab=stars
  configureTipAction('float-right', starringContainerInsertFunction)

  // Format: https://gist.github.com/<user>/<gist_number>
  configureTipAction('pagehead-actions', pageheadInsertFunction)

  // Format: https://github.com/orgs/<org>/people
  // Format: https://github.com/orgs/<org>/teams/<team_name>/members
  configureTipAction('member-list-item', memberListItemInsertFunction)

  timeout = setTimeout(configure, 3000)
}

// Mutation observer for responding to DOM changes. This allows us to
// reinsert the inline tip button when the DOM changes during normal
// operation (for example, when the user clicks on a checkbox).
const onMutate = (mutations: MutationRecord[], observer: MutationObserver) => {
  for (const { removedNodes } of mutations) {
    for (const node of removedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue
      }
      const element = node as HTMLElement
      if (element.classList.contains('timeline-comment-header')) {
        configure()
        return
      } else if (element.hasChildNodes()) {
        const elements =
          element.getElementsByClassName('timeline-comment-header')
        if (elements && elements.length > 0) {
          configure()
          return
        }
      }
    }
  }
}

const observerTarget = document.getElementById('discussion_bucket')
if (observerTarget) {
  const observer = new MutationObserver(onMutate)
  observer.observe(observerTarget, {
    childList: true,
    subtree: true
  })
}
