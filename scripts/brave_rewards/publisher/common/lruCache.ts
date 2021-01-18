/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

export class LruCache<T> {

  private values: Map<string, T> = new Map<string, T>()
  private maxEntries: number

  constructor (maxEntries: number) {
    this.maxEntries = maxEntries
  }

  get (key: string): T | null {
    if (!key) {
      return null
    }

    const entry = this.values.get(key)
    if (!entry) {
      return null
    }

    this.values.delete(key)
    this.values.set(key, entry)

    return entry
  }

  put (key: string, value: T) {
    if (this.values.size >= this.maxEntries) {
      const key = this.values.keys().next().value
      this.values.delete(key)
    }

    this.values.set(key, value)
  }
}
