/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

let registeredOnUpdatedTab = false

export const registerOnUpdatedTab = (
  mediaType: string,
  callback: (changeInfo: any) => void
) => {
  if (!mediaType || registeredOnUpdatedTab) {
    return
  }

  registeredOnUpdatedTab = true

  const runCallback = () => {
    console.debug('OnUpdatedTab', location.href)
    // Adapter for registerOnUpdatedTab consumers.
    callback({status : 'complete', url: location.href})
  }

  // TODO: filter events
  (window as any).navigation.addEventListener('navigate', runCallback)
}
