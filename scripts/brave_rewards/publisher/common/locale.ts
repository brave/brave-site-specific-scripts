/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

export const getMessage = (
  message: string,
  substitutions?: string[]
): string => {
  if (chrome.i18n) {
    return chrome.i18n.getMessage(message, substitutions)
  }

  return message
}
