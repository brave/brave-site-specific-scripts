/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const initScript = () => {
// ads are enabled, so add the "Start a one-to-one video call" button!

  const element = document.getElementById('enter_1on1_button')

  if (element) element.style.display = 'inline-block'
}

initScript()
