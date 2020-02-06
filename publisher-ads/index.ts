// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

import sendMessageToBrave from '../common/contentScript/sendMessageToBrave'

export type AdSize = [number, number]
export type PublisherAd = {
  creative_instance_id: string,
  creative_set_id: string,
  category: string,
  size: string,
  creative_url: string,
  target_url: string
}

export function stringToAdSize (sizeString: string): AdSize | null {
  const sizeData = sizeString.split('x')
  if (sizeData.length == 2) {
    return [Number(sizeData[0]), Number(sizeData[1])]
  }
  return null
}

export function adSizeToString (size: AdSize): string {
  return `${size[0]}x${size[1]}`
}

export type TriggerViewFunction = (ad: PublisherAd) => void
export type TriggerInteractionFunction = (ad: PublisherAd) => void

export const triggerView: TriggerViewFunction = function TriggerView (ad: PublisherAd) {
  sendMessageToBrave(
    {
      type: 'ads-trigger-view',
      ad
    }
  )
}

export const triggerInteraction: TriggerInteractionFunction = function TriggerInteraction (ad: PublisherAd) {
  sendMessageToBrave(
    {
      type: 'ads-trigger-interaction',
      ad
    }
  )
}
