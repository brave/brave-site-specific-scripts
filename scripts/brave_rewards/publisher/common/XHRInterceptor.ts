/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

 import {RequestHandlerMessageEvent, RegisterRequestHandlerEvent} from '../common/XHREvents'

let headerProcessUrlPattern: RegExp | undefined;
class CustomXMLHttpRequest extends XMLHttpRequest {
  headers: {[header: string]: string} = {}
//  url: string | undefined;

  // override open(method: string, url: string | URL): void;
  // override open(
  //     method: string, url: string | URL, isAsync: boolean,
  //     username?: any): void;
  // override open(
  //     method: string, url: string | URL, isAsync?: boolean,
  //     username?: any,
  //     password?: any): void {

  //   this.url = url instanceof URL ? url.toString() : url
  //   const realAsync = isAsync ? isAsync : true;
  //   super.open(method, url, realAsync, username, password);
  // }

  override setRequestHeader(name: string, value: string): void {
    this.headers[name] = value
    super.setRequestHeader(name, value)
  }

  private onLoaded() {
    const match = !headerProcessUrlPattern || this.responseURL.match(headerProcessUrlPattern)
    if (match) {
      console.debug('process url', this.responseURL, this.headers)
      window.dispatchEvent(RequestHandlerMessageEvent.makeEvent(
              {url: this.responseURL, headers: this.headers}))
    } else {
      console.debug('skip url', this.responseURL)
    }
  }

  override send(body?: any): void {
    this.addEventListener("loadend", () => {this.onLoaded()});
    super.send(body)
  }

  // override send(body?: any): void {
  //   if (!headerProcessUrlPattern || !this.url) {
  //     if (this.url && headerProcessUrlPattern &&  this.url.match(headerProcessUrlPattern)) {
  //       window.dispatchEvent(RequestHandlerMessageEvent.makeEvent(
  //         {url: this.url, headers: this.headers}))
  //     } else {
  //       console.log('skip url', this.url)
  //     }
  //   }
  //   super.send(body)
  // }
}

const initRequestHandler = (urlPattern?: string) => {
  XMLHttpRequest = CustomXMLHttpRequest
  headerProcessUrlPattern = urlPattern ? new RegExp(urlPattern) : undefined
  console.log('initRequestHandler', urlPattern, headerProcessUrlPattern)
}


export const initScript = () => {
  RegisterRequestHandlerEvent.subscribe((e) => {
    const urlPattern = e.urlPattern
    initRequestHandler(urlPattern)
  })
}

initScript()
