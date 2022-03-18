/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const cache = new Map<string, string>()

export const getMessage = (messageName: string): string => {
  let message = ''
  try {
    message = chrome.i18n.getMessage(messageName) || ''
  } catch {
    // The `i18n` API may not be available.
  }
  if (message) {
    cache.set(messageName, message)
    return message
  }
  return cache.get(messageName) || ''
}
