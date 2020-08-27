import * as ytUtils from './utils'

test('builds channel url', () => {
  expect(ytUtils.buildChannelUrl('UCxVXX2JqatsN4xwtjd3W5Kg'))
    .toBe('https://www.youtube.com/channel/UCxVXX2JqatsN4xwtjd3W5Kg')
})

test('builds media key', () => {
  expect(ytUtils.buildMediaKey('8iULSxHQ0tM')).toBe('youtube_8iULSxHQ0tM')
})

test('builds publisher key', () => {
  expect(ytUtils.buildPublisherKey('UCxVXX2JqatsN4xwtjd3W5Kg'))
    .toBe('youtube#channel:UCxVXX2JqatsN4xwtjd3W5Kg')
})

test('builds video url', () => {
  expect(ytUtils.buildVideoUrl('8iULSxHQ0tM'))
    .toBe('https://www.youtube.com/watch?v=8iULSxHQ0tM')
})

test('gets channel id from empty url', () => {
  expect(ytUtils.getChannelIdFromUrl('')).toBe('')
})

test('gets channel id from non-matching url', () => {
  expect(ytUtils.getChannelIdFromUrl('https://www.google.com/')).toBe('')
})

test('gets channel id from matching url', () => {
  expect(ytUtils.getChannelIdFromUrl('https://www.youtube.com/channel/UCxVXX2JqatsN4xwtjd3W5Kg'))
    .toBe('UCxVXX2JqatsN4xwtjd3W5Kg')
})

test('gets media id from non-matching url', () => {
  expect(ytUtils.getMediaIdFromUrl(new URL('https://www.google.com/'))).toBe('')
})

test('gets channel id from matching url with empty query param', () => {
  const url = new URL('https://www.youtube.com/watch')
  expect(ytUtils.getMediaIdFromUrl(url)).toBe('')
})

test('gets channel id from matching url with incorrect query param', () => {
  const url = new URL('https://www.youtube.com/watch?x=8iULSxHQ0tM')
  expect(ytUtils.getMediaIdFromUrl(url)).toBe('')
})

test('gets channel id from matching url', () => {
  const url = new URL('https://www.youtube.com/watch?v=8iULSxHQ0tM')
  expect(ytUtils.getMediaIdFromUrl(url)).toBe('8iULSxHQ0tM')
})

test('gets user from empty url', () => {
  expect(ytUtils.getUserFromUrl('')).toBe('')
})

test('gets user from non-matching url', () => {
  expect(ytUtils.getUserFromUrl('https://www.google.com/')).toBe('')
})

test('gets user from matching url', () => {
  expect(ytUtils.getUserFromUrl('https://www.youtube.com/user/Scobleizer')).toBe('Scobleizer')
})
