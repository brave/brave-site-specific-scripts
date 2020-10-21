/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createPort } from '../common/messaging'

import * as publisherInfo from './publisherInfo'

const initScript = () => {
  // Don't run in incognito context
  if (chrome.extension.inIncognitoContext) {
    return
  }

  createPort()

  // Load publisher info and register webRequest.OnCompleted handler
  // when document finishes loading
  document.addEventListener('readystatechange', function () {
    if (document.readyState === 'complete' &&
        document.visibilityState === 'visible') {
      setTimeout(() => {
        publisherInfo.send()
      }, 200)
    }
  })

  // Load publisher info and register webRequest.OnCompleted handler
  // on visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      publisherInfo.send()
    }
  })

  console.info('Greaselion script loaded: vimeo.ts')
}

initScript()
