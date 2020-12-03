import * as utils from './utils'

test('builds profile url for new reddit', () => {
  expect(utils.buildProfileUrl('emerick', false))
    .toBe('https://www.reddit.com/user/emerick/')
})

test('builds profile url for old reddit', () => {
  expect(utils.buildProfileUrl('emerick', true))
    .toBe('https://old.reddit.com/user/emerick/')
})

test('confirms that url points to old reddit', () => {
  const url = new URL('https://old.reddit.com/user/emerick')
  expect(utils.isOldRedditUrl(url)).toBe(true)
})

test('confirms that url does not point to old reddit', () => {
  const url = new URL('https://www.reddit.com/user/emerick')
  expect(utils.isOldRedditUrl(url)).toBe(false)
})

test('confirms that path points to a reddit thread', () => {
  const path =
    '/r/MechanicalKeyboards/comments/jbge7k/this_is_peak_level_innovation/'
  expect(utils.isThreadPath(path)).toBe(true)
})

test('confirms that path does not point to a reddit thread', () => {
  const path = '/user/emerick'
  expect(utils.isThreadPath(path)).toBe(false)
})

test('gets screen name from matching url', () => {
  const url = new URL('https://www.reddit.com/user/emerick')
  expect(utils.getScreenNameFromUrl(url)).toBe('emerick')
})

test('gets screen name from url with no path', () => {
  const url = new URL('https://www.reddit.com')
  expect(utils.getScreenNameFromUrl(url)).toBe('')
})

test('root path is excluded', () => {
  expect(utils.isExcludedPath('/')).toBe(true)
})

test('path is excluded', () => {
  expect(utils.isExcludedPath('/login')).toBe(true)
})

test('path is not excluded', () => {
  expect(utils.isExcludedPath('/foo')).toBe(false)
})
