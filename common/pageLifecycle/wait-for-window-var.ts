// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

import injectToDocument from '../contentScript/inject-to-document'

type OnValueFunction = (varValue: any) => void
type VarValueCustomEvent = CustomEvent<{ varValue: any}>

// Intercepts the setting of a global variable on the page
// and returns it to a callback function when it is set.
export default function waitForWindowVar(varName: string, onValue: OnValueFunction) {

  const customEventName = `brave-value-found-${varName}`

  function onCustomEvent (e: VarValueCustomEvent) {
    const { varValue } = e.detail
    if (varValue) {
      window.removeEventListener(customEventName, onCustomEvent)
      onValue(varValue)
    }
  }

  window.addEventListener(customEventName, onCustomEvent)

  function fnPageInjectionCode ($varName: string, $customEventName: string) {
    function valueFound (varValue: any) {
      window.dispatchEvent(new CustomEvent($customEventName, {
        detail: {
          varValue
        },
        bubbles: true
      }))
    }

    if (window[$varName]) {
      valueFound(window[$varName])
      return
    }

    let _value: any
    Object.defineProperty(window, $varName, {
      configurable: true,
      set: function (value) {
        _value = value
        valueFound(_value)
      },
      get: function () {
        return _value
      }
    })
  }

  injectToDocument(fnPageInjectionCode, varName, customEventName)
}
