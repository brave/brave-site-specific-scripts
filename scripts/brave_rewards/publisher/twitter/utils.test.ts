import * as utils from './utils'

test('builds media key', () => {
  expect(utils.buildMediaKey('user')).toBe('twitter_user')
})

test('builds publisher key', () => {
  expect(utils.buildPublisherKey('12345')).toBe('twitter#channel:12345')
})

test('builds profile url with empty params', () => {
  expect(utils.buildProfileUrl('', '')).toBe('')
})

test('builds profile url with screen name only', () => {
  expect(utils.buildProfileUrl('user'))
    .toBe('https://twitter.com/user/')
})

test('builds profile url with user id and screen name', () => {
  expect(utils.buildProfileUrl('user', '12345'))
    .toBe('https://twitter.com/intent/user?user_id=12345&screen_name=user')
})

test('gets publisher name from page with matching title', () => {
  document.title = 'User (@user)'
  expect(utils.getPublisherNameFromPage()).toBe('User')
})

test('gets publisher name from page with empty title', () => {
  document.title = ''
  expect(utils.getPublisherNameFromPage()).toBe('')
})

test('gets publisher name from page with non-matching title', () => {
  document.title = 'User (user)'
  expect(utils.getPublisherNameFromPage()).toBe('')
})

test('gets screen name from matching url', () => {
  const url = new URL('https://www.twitter.com/user')
  expect(utils.getScreenNameFromUrl(url)).toBe('user')
})

test('gets screen name from matching url query param', () => {
  const url = new URL('https://www.twitter.com/foo?screen_name=user')
  expect(utils.getScreenNameFromUrl(url)).toBe('user')
})

test('gets screen name from matching url with incorrect query param', () => {
  const url = new URL('https://www.twitter.com/foo?bar=user')
  expect(utils.getScreenNameFromUrl(url)).toBe('foo')
})

test('gets screen name from matching tweet url', () => {
  const url = new URL('https://twitter.com/lukemulks/status/1293113074317049856')
  expect(utils.getScreenNameFromUrl(url)).toBe('lukemulks')
})

test('root path is excluded', () => {
  expect(utils.isExcludedPath('/')).toBe(true)
})

test('path is excluded', () => {
  expect(utils.isExcludedPath('/about')).toBe(true)
})

test('path is excluded based on start match', () => {
  expect(utils.isExcludedPath('/account/foo')).toBe(true)
})

test('path is not excluded', () => {
  expect(utils.isExcludedPath('/foo')).toBe(false)
})
