// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

export default function runOnFirstVisible(fn: Function) {
  if (document.visibilityState === 'visible') {
    fn()
  } else {
    function onVisible() {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', onVisible)
        fn()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
  }
}
