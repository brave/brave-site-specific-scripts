import * as utils from './utils'

test('extracts data from empty string', () => {
  expect(utils.extractData('', '/', '!')).toBe('')
})

test('extracts data with missing start param', () => {
  expect(utils.extractData('st/find/me!', '', '!')).toBe('st/find/me')
})

test('extracts data with missing end param', () => {
  expect(utils.extractData('st/find/me!', '/', '')).toBe('find/me!')
})

test('extracts data all ok', () => {
  expect(utils.extractData('st/find/me!', '/', '!')).toBe('find/me')
})
