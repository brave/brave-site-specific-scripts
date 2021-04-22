import * as utils from './utils'

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

test('tab is not allowed (empty querystring)', () => {
  expect(utils.isAllowedTab('')).toBe(false)
})

test('tab is not allowed (no tab specifier in querystring)', () => {
  expect(utils.isAllowedTab('?foo=bar')).toBe(false)
})

test('tab is not allowed (no entry in allowlist)', () => {
  expect(utils.isAllowedTab('?tab=repositories')).toBe(false)
})

test('tab is allowed', () => {
  expect(utils.isAllowedTab('?tab=stars')).toBe(true)
})
