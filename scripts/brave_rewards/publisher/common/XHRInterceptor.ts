/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

 import {HeadersHandlerMessageEvent, RegisterHeadersHandlerEvent} from '../common/XHREvents'

let headerProcessUrlPattern: RegExp | undefined;
class CustomXMLHttpRequest extends XMLHttpRequest {
  headers: {[header: string]: string} = {}
  url: string | undefined;

  override open(method: string, url: string | URL): void;
  override open(
      method: string, url: string | URL, isAsync: boolean,
      username?: any): void;
  override open(
      method: string, url: string | URL, isAsync?: boolean,
      username?: any,
      password?: any): void {

    this.url = url instanceof URL ? url.toString() : url
    const realAsync = isAsync ? isAsync : true;
    super.open(method, url, realAsync, username, password);
  }

  override setRequestHeader(name: string, value: string): void {
    this.headers[name] = value
    super.setRequestHeader(name, value)
  }

  override send(body?: any): void {
    if (!headerProcessUrlPattern || !this.url || this.url.search(headerProcessUrlPattern) >= 0) {
      window.dispatchEvent(HeadersHandlerMessageEvent.makeEvent(
        {url: this.url, headers: this.headers}))
    }
    super.send(body)
  }
}

const initHeadersHandler = (urlPattern?: string) => {
  XMLHttpRequest = CustomXMLHttpRequest
  headerProcessUrlPattern = urlPattern ? new RegExp(urlPattern) : undefined
}


export const initScript = () => {
  RegisterHeadersHandlerEvent.subscribe((e) => {
    const urlPattern = e.urlPattern
    initHeadersHandler(urlPattern)
  })
}

initScript()
