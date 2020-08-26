// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

import injectToDocument from '../common/contentScript/inject-to-document'

type HelpCenter = any

injectToDocument(function PageScript() {
  const helpCenterProxyHandler: ProxyHandler<HelpCenter> = {
    set (helpCenterVal, propName, value) {
      if (propName === 'internal') {
        helpCenterVal.internal = {
          ...value,
          usage_tracking: undefined
        }
      } else {
        helpCenterVal[propName] = value
      }
      return true
    }
  }

  let helpCenterVal: HelpCenter
  Object.defineProperty(window, 'HelpCenter', {
    configurable: true,
    set: function (val) {
      helpCenterVal = new Proxy(val, helpCenterProxyHandler)
    },
    get: function () {
      return helpCenterVal
    }
  })
})
