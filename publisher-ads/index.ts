// Copyright (c) 2020 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// you can obtain one at http://mozilla.org/MPL/2.0/.

export type AdSize = [number, number]

export function stringToAdSize (sizeString: string): AdSize | null {
  const sizeData = sizeString.split('x')
  if (sizeData.length == 2) {
    return [Number(sizeData[0]), Number(sizeData[1])]
  }
  return null
}
