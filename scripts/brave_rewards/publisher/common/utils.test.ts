import * as utils from './utils'

test('builds media key', () => {
  expect(utils.buildMediaKey('youtube', '8iULSxHQ0tM')).
    toBe('youtube_8iULSxHQ0tM')
})

test('builds publisher key', () => {
  expect(utils.buildPublisherKey('youtube', 'UCxVXX2JqatsN4xwtjd3W5Kg'))
    .toBe('youtube#channel:UCxVXX2JqatsN4xwtjd3W5Kg')
})

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
