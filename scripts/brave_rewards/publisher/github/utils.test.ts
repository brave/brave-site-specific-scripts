import * as utils from './utils'

test('builds media key', () => {
  expect(utils.buildMediaKey('user')).toBe('github_user')
})

test('builds publisher key', () => {
  expect(utils.buildPublisherKey('12345')).toBe('github#channel:12345')
})

test('builds profile url with empty params', () => {
  expect(utils.buildProfileUrl('')).toBe('')
})

test('builds profile url with screen name only', () => {
  expect(utils.buildProfileUrl('user'))
    .toBe('https://github.com/user/')
})

test('builds profile api url with empty params', () => {
  expect(utils.buildProfileApiUrl('')).toBe('')
})

test('builds profile url with screen name only', () => {
  expect(utils.buildProfileApiUrl('user'))
    .toBe('https://api.github.com/users/user')
})

test('gets screen name from matching url', () => {
  const url = new URL('https://github.com/user')
  expect(utils.getScreenNameFromUrl(url)).toBe('user')
})

test('root path is excluded', () => {
  expect(utils.isExcludedPath('/')).toBe(true)
})

test('path is excluded', () => {
  expect(utils.isExcludedPath('/about')).toBe(true)
})

test('path is not excluded', () => {
  expect(utils.isExcludedPath('/foo')).toBe(false)
})

test('tab is in blocklist', () => {
  expect(utils.isBlocklistedTab('?tab=repositories')).toBe(true)
})

test('tab is not in blocklist', () => {
  expect(utils.isBlocklistedTab('?tab=stars')).toBe(false)
})
