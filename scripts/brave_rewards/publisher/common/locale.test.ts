import * as locale from './locale'

const messages = {
  key1: 'Message 1',
  key2: 'Message 2'
}

beforeEach(() => {
  Object.defineProperty(window, 'chrome', {
    configurable: true,
    writable: true,
    value: {
      i18n: {
        getMessage(key: string) { return messages[key] }
      }
    }
  })
})

test('getMessage', () => {
  expect(locale.getMessage('key1')).toBe('Message 1')
  expect(locale.getMessage('foo')).toBe('')

  // Remove i18n API. This seems to happen in practice when GL reloads
  // extensions.
  Object.defineProperty(window, 'chrome', {
    configurable: true,
    writable: true,
    value: {}
  })

  expect(locale.getMessage('key1')).toBe('Message 1')
  expect(locale.getMessage('key2')).toBe('')
})
