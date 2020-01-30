// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

export default function injectToDocument (isolatedFn: Function, ...codeVars: any[]) {
  // Convert function to single-scope and stringify
  const codeToEval = `(
    ${isolatedFn.toString()}
  )(${codeVars.map(prop => JSON.stringify(prop)).join(', ')})`

  function inject () {
    const scriptEl = document.createElement('script')
    scriptEl.async = true
    scriptEl.textContent = codeToEval
    ;(document.body || document.documentElement).appendChild(scriptEl)
    requestAnimationFrame(() => {
      scriptEl.remove()
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject)
  } else {
    inject()
  }
}
