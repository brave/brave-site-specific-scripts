/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const initYubicoScript = () => {
  const link = document.createElement('meta')
  link.setAttribute('name', 'ad-conversion-id')
  link.content = 'XXXX'
  document.getElementsByTagName('head')[0].appendChild(link)
}

initYubicoScript()
