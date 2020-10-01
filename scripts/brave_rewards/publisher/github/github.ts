/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as commonTypes from '../common/types'
import * as locale from '../common/locale'
import * as types from './types'
import * as utils from './utils'

let port: chrome.runtime.Port | null = null

let registeredOnUpdatedTab = false

let configureTipActionsTimeout: any = null

let lastLocation = ''

const actionTipClass = 'action-brave-tip'
const tipActionCountClass = 'GitHubTip-actionCount'
const tipIconContainerClass = 'IconContainer'

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

const sendErrorResponse = (errorMessage: string) => {
  if (!port) {
    return
  }

  port.postMessage({
    type: 'GreaselionError',
    mediaType: types.mediaType,
    data: {
      errorMessage
    }
  })
}

const createTipAction = (elem: Element, getMetaData: (elem: Element) => Promise<MediaMetaData>) => {
  const hoverClasses = ' tooltipped tooltipped-sw tooltipped-align-right-1'

  // Create the tip action
  const tipAction = document.createElement('div')
  tipAction.className = 'GitHubTip-action js-tooltip ' + actionTipClass + hoverClasses
  tipAction.style.display = 'inline-block'
  tipAction.style.minWidth = '40px'

  const tipActionHoverText = locale.getMessage('githubTipsHoverText')
  if (tipActionHoverText) {
    tipAction.setAttribute('aria-label', tipActionHoverText)
  }

  // Create the tip button
  const tipButton = document.createElement('button')
  tipButton.className = 'GitHubTip-actionButton u-textUserColorHover js-actionButton'
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

  const tipActionCountPresentationLabel = locale.getMessage('githubTipsIconLabel')
  if (tipActionCountPresentationLabel) {
    tipActionCountPresentation.textContent = tipActionCountPresentationLabel
  }

  tipActionCount.appendChild(tipActionCountPresentation)

  // Create the shadow DOM root that hosts our injected DOM elements
  const shadowRoot = tipAction.attachShadow({ mode: 'open' })
  shadowRoot.appendChild(tipButton)

  // Create style element for hover color
  const style = document.createElement('style')
  style.appendChild(document.createTextNode('.GitHubTip-actionButton :hover { color: #FB542B }'))
  shadowRoot.appendChild(style)

  return tipAction
}

const getCommentMetaData = async (elem: Element) => {
  let ancestor = elem.closest('.timeline-comment-header')
  ancestor = ancestor ? ancestor : elem.closest('.review-comment')
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

  return getMediaMetaData(screenName)
}

const commentInsertFunction = (parent: Element) => {
  if (!parent) {
    return
  }

  const tipAction = createTipAction(parent, getCommentMetaData)
  if (!tipAction) {
    return
  }

  if (tipAction.shadowRoot) {
    tipAction.style.marginRight = '2px'

    let iconContainer = tipAction.shadowRoot.querySelector(`.${tipIconContainerClass}`) as HTMLElement
    if (iconContainer) {
      iconContainer.style.paddingBottom = '5px'
    }

    let braveTipActionCount = tipAction.shadowRoot.querySelector(`.${tipActionCountClass}`) as HTMLElement
    if (braveTipActionCount) {
      braveTipActionCount.style.paddingBottom = '2px'
    }
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

  return getMediaMetaData(screenName)
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

  return getMediaMetaData(screenName)
}

const starringContainerInsertFunction = (parent: Element) => {
  if (!parent) {
    return
  }

  if (utils.isBlocklistedTab(window.location.search)) {
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

  return getMediaMetaData(screenName)
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
  if (subdomain !== 'gist' || window.location.pathname.slice(1).split('/').length < 2) {
    return
  }

  const tipAction = createTipAction(parent, getPageHeadMetaData)
  parent.appendChild(tipAction)
}

const getMemberListItemMetaData = async (elem: Element) => {
  if (!elem) {
    throw new Error('Invalid arguments')
  }

  const ancestor = elem.closest('.table-list-cell')
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

  return getMediaMetaData(screenName)
}

const memberListItemInsertFunction = (parent: Element) => {
  if (!parent || !parent.children || parent.children.length < 2) {
    return
  }

  const path = window.location.pathname
  const memberText = parent.children[1] as HTMLElement
  if (!memberText || !path.startsWith('/orgs/')) {
    return
  }

  const tipAction = createTipAction(memberText as Element, getMemberListItemMetaData)

  tipAction.style.paddingLeft = '5px'

  if (path.split('/').includes('teams')) { // Special case, different styling for same element
    memberText.appendChild(tipAction)
  } else {
    memberText.style.width = '250px'
    if (memberText.children.length > 0) {
      memberText.insertBefore(tipAction, memberText.children[1])
    }
  }
}

const configureTipActions = () => {
  clearTimeout(configureTipActionsTimeout)

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

  configureTipActionsTimeout = setTimeout(configureTipActions, 3000)
}

const configureTipAction = (tipLocationClass: string, insertFunction: (parent: Element) => void) => {
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

const handleOnUpdatedTab = (changeInfo: any) => {
  // When sites use the history API, it can cause spurious
  // tabs.onUpdated notifications. In order to work around that, look
  // for a changeInfo with a URL or a status of complete and then
  // store the location if it doesn't match.
  if (!changeInfo || (!changeInfo.url && changeInfo.status !== 'complete')) {
    return
  }

  if (location.href !== lastLocation) {
    lastLocation = location.href
    sendPublisherInfo()
    configureTipActions()
  }
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
    mediaType: types.mediaType
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

const getMediaMetaData = async (screenName: string) => {
  if (!screenName) {
    throw new Error('Invalid parameters')
  }

  const profileApiUrl = utils.buildProfileApiUrl(screenName)
  if (!profileApiUrl) {
    throw new Error('Invalid profile api url')
  }

  const response = await fetch(profileApiUrl)
  if (!response.ok) {
    throw new Error(`Profile API request failed: ${response.statusText} (${response.status})`)
  }

  const data = await response.json()
  return {
    user: {
      id: data.id,
      screenName: data.login,
      fullName: data.name || data.login,
      favIconUrl: data.avatar_url
    },
    post: {
      id: '',
      timestamp: '',
      text: ''
    }
  }
}

const sendPublisherInfoForStandardPage = (url: URL) => {
  const screenName = utils.getScreenNameFromUrl(url)
  if (!screenName) {
    sendErrorResponse('Invalid screen name')
    return
  }

  return getMediaMetaData(screenName)
    .then((mediaMetaData: MediaMetaData) => {
      const userId = mediaMetaData.user.id
      const publisherKey = utils.buildPublisherKey(userId)
      const publisherName = mediaMetaData.user.fullName
      if (!publisherName) {
        sendErrorResponse('Invalid publisher name')
        return
      }

      const mediaKey = ''
      const favIconUrl = mediaMetaData.user.favIconUrl

      const profileUrl = utils.buildProfileUrl(screenName)

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

  const profileUrl = utils.buildProfileUrl(mediaMetaData.user.screenName)
  const publisherKey = utils.buildPublisherKey(mediaMetaData.user.id)
  const publisherName = mediaMetaData.user.fullName
  const publisherScreenName = mediaMetaData.user.screenName

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

const initScript = () => {
  // Don't run in incognito context
  if (chrome.extension.inIncognitoContext) {
    return
  }

  port = chrome.runtime.connect(commonTypes.braveRewardsExtensionId, { name: 'Greaselion' })

  // Send publisher info and configure tip action on visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      sendPublisherInfo()
      configureTipActions()
    }
  })

  registerOnUpdatedTab()

  console.info('Greaselion script loaded: github.ts')
}

initScript()
