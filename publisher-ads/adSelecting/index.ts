// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

import { PublisherAd, stringToAdSize } from '../'

export default function SelectBiggestAd (ads: PublisherAd[]): PublisherAd {
  if (!ads.length) {
    throw new Error('SelectBiggestAd: ads should not be empty!')
  }
  if (ads.length === 1) {
    return ads[0]
  }
  return ads.sort(function (a, b) {
    const sizeA = stringToAdSize(a.size)
    const sizeB = stringToAdSize(b.size)
    if (!sizeA || !sizeB) return 0
    return (sizeB[0] * sizeB[1]) - (sizeA[0] * sizeA[1])
  })[0]
}
