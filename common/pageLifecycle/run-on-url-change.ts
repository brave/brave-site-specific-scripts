// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

import injectToDocument from '../contentScript/inject-to-document'

const customEventName = 'brave-url-changed'

export default function runOnUrlChange(fn: Function) {
  // content script observes
  window.addEventListener(customEventName, (e) => fn())
  // document script fires
  function fnPageInjectionCode ($customEventName: string) {
    console.log('replacing events and sending name', $customEventName)

    const prevPushState = window.history.pushState
    const prevReplaceState = window.history.replaceState

    window.history.pushState = function (...args) {
      console.log('pushState was called')
      requestAnimationFrame(() => window.dispatchEvent(new CustomEvent($customEventName)))
      return prevPushState.call(this, ...args)
    }

    window.history.replaceState = function (...args) {
      console.log('replaceState was called')
      requestAnimationFrame(() => window.dispatchEvent(new CustomEvent($customEventName)))
      return prevReplaceState.call(this, ...args)
    }
  }
  injectToDocument(fnPageInjectionCode, customEventName)
}
