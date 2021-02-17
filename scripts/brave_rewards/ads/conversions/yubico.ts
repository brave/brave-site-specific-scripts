/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const initYubicoScript = () => {
  const el = document.getElementsByClassName('order-info')
  let orderId = ''
  if (el && el[0] && el[0].firstChild && el[0].firstChild.firstChild) {
    orderId = el[0].firstChild.firstChild.textContent!.replace('Order Number: ', '')
  }

  if (orderId !== '') {
    const link = document.createElement('meta')
    link.setAttribute('name', 'ad-conversion-id')
    link.content = orderId
    document.getElementsByTagName('head')[0].appendChild(link)
  }
}

initYubicoScript()
