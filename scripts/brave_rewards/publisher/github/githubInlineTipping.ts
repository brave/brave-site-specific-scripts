/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createPort } from './messaging'

import * as tabHandlers from './tabHandlers'
import * as tipping from './tipping'

let lastLocation = ''

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
    tipping.configure()
  }
}

const initScript = () => {
  // Don't run in incognito context
  if (chrome.extension.inIncognitoContext) {
    return
  }

  createPort()

  // Configure tip action on visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      tipping.configure()
    }
  })

  tabHandlers.registerOnUpdatedTab(handleOnUpdatedTab)

  console.info('Greaselion script loaded: githubInlineTipping.ts')
}

initScript()
