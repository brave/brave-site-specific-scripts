// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

import injectToDocument from '../common/contentScript/inject-to-document'
import BATAd from './bat-ad'
import fetchAdCreatives from './creativeFetch/same-context'
import { AdSize, stringToAdSize, triggerInteraction, triggerView } from './'
import runOnPageLoaded from '../common/pageLifecycle/run-on-loaded'

console.log("content script")
type SlotDefinition = {
  adUnitPath: string,
  size: googletag.GeneralSize
  elementId?: string
}

type PageSlotsEventData = { pageSlots: SlotDefinition[] }

const eventName = `brave-gpt-slots-ready`

function googleSizeToAdSize (sizeParam: googletag.GeneralSize): AdSize[] | null {
  if (typeof sizeParam === 'string') {
    const size = stringToAdSize(sizeParam)
    if (!size) {
      return []
    }
    return [ size ]
  } else if (Array.isArray(sizeParam)) {
    if (sizeParam.every((i: any) => Array.isArray(i))) {
      return sizeParam as AdSize[]
    }
    if (sizeParam.length === 2 && sizeParam.every((i: any) => typeof i === 'number')) {
      return [sizeParam as AdSize] 
    }
    if (sizeParam.every((i: any) => typeof i === 'string')) {
      const stringSizes: string[] = sizeParam as string[]
      const adSizes: AdSize[] = stringSizes
        .map(stringToAdSize)
        .filter((size: AdSize | null) => size !== null) as AdSize[]
      return adSizes
    }
  }
  // TODO(petemill): There seem to be more types that googletag.GeneralSize can be that
  // we are not handling here. Implement conversions as we encounter those types.
  return null
}

function elementIdFromAdUnitPath (adUnitPath: string): string {
  const segments = adUnitPath.split('/')
  return segments[segments.length - 1]
}

// Content script receives information about the ads from the Page
window.addEventListener(eventName, function (e: CustomEvent<PageSlotsEventData>) {
  console.log('Content script received page slots', e.detail.pageSlots)
  const { detail: { pageSlots }} = e
  runOnPageLoaded(function () { 
    for (const slot of pageSlots) {
      const sizes = googleSizeToAdSize(slot.size)
      if (!sizes) {
        console.error('Brave Publisher Ads: could not find sizes for slot', slot)
        continue
      }
      const selector = slot.elementId || elementIdFromAdUnitPath(slot.adUnitPath)
      const element = document.querySelector<HTMLElement>(`#${selector}`)
      if (!element) {
        console.error('Brave Publisher Ads: could not find element for slot', slot)
        continue
      }
      new BATAd(element, fetchAdCreatives, triggerView, triggerInteraction).sizes = sizes
    }
  })
})

// Page script sends information about the ads to the Content Script
injectToDocument(function ($eventName: string) {
  console.log('inject')
  function observeGoogleTag(googletag: googletag.Googletag) {
    // @ts-ignore
    googletag.__isObserved = true
    console.log('observe')
    // Page usually defines googletag before this script runs, 
    // then the stub adds the api functions, usually after this script runs.
    // If we simple define the functions then they will be
    // overwritten.
    // Instead, Proxy them.
    let actualDefineSlots = googletag.defineSlot
    let actualEnableServices = googletag.enableServices
    const pageSlots: SlotDefinition[] = []
    
    googletag.defineSlot = function (adUnitPath, size, elementId) {
      pageSlots.push({ adUnitPath, size, elementId })
      return actualDefineSlots(adUnitPath, size)
    }
    
    googletag.enableServices = function () {
      window.dispatchEvent(new CustomEvent<PageSlotsEventData>($eventName, {
        detail: {
          pageSlots
        },
        bubbles: true
      }))
      actualEnableServices()
    }

    return new Proxy(googletag, {
      set (googletag, propName, value) {
        if (propName === 'defineSlot') {
          actualDefineSlots = value
        } else if (propName === 'enableServices') {
          actualEnableServices = value
        } else {
          googletag[propName] = value
        }
        return true
      }
    })
  }
  
  if (window['googletag']) {
    googletag = observeGoogleTag(googletag)
  } else {
    console.log('googletag was not defined')
    // Maybe the Page didn't define it, so wait in case it gets defined.
    let _value: googletag.Googletag
    Object.defineProperty(window, 'googletag', {
      configurable: true,
      set: function (value) {
        console.log("googletag = set")
        _value = (value.__isObserved ? value : observeGoogleTag(value))
      },
      get: function () {
        return _value
      }
    })
  }
}, eventName)
