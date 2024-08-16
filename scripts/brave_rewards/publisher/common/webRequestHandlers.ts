/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import {RequestHandlerMessageEvent, RegisterRequestHandlerEvent} from '../common/XHREvents'

export const registerOnBeforeRequestHandler = (
  urlPattern: string | undefined,
  callback: (event: RequestHandlerMessageEvent) => void
) => {
  RequestHandlerMessageEvent.subscribe((e) => callback(e))
  console.log('send RegisterRequestHandlerEvent')
  dispatchEvent(RegisterRequestHandlerEvent.makeEvent({urlPattern}))
}
