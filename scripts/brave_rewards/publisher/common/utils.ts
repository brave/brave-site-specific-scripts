/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

export const extractData = (data: string, matchAfter: string, matchUntil: string) => {
  if (data.length < matchAfter.length) {
    return ''
  }

  const matchPos = data.indexOf(matchAfter)
  if (matchPos === -1) {
    return ''
  }

  const startPos = matchPos + matchAfter.length
  const endPos = data.indexOf(matchUntil, startPos)

  let match = ''

  if (endPos !== startPos) {
    if (endPos !== -1 && endPos > startPos) {
      match = data.substring(startPos, endPos)
    } else if (endPos !== -1) {
      match = data.substring(startPos, endPos)
    } else {
      match = data.substring(startPos)
    }
  } else if (matchUntil === '') {
    match = data.substring(startPos)
  }

  return match
}

export const areObjectsEqualShallow = (firstObj: {}, secondObj: {}) => {
  const firstObjPropertyNames = Object.getOwnPropertyNames(firstObj)
  const secondObjPropertyNames = Object.getOwnPropertyNames(secondObj)

  if (firstObjPropertyNames.length !== secondObjPropertyNames.length) {
    return false
  }

  for (let i = 0; i < firstObjPropertyNames.length; i++) {
    const propertyName = firstObjPropertyNames[i]
    if (firstObj[propertyName] !== secondObj[propertyName]) {
      return false
    }
  }

  return true
}
