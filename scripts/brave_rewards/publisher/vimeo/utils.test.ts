import * as utils from './utils'

test('builds favicon url', () => {
  expect(utils.buildFavIconUrl('40638487'))
    .toBe('https://i.vimeocdn.com/portrait/40638487_300x300.webp')
})

test('builds video url', () => {
  expect(utils.buildVideoUrl('40638487')).toBe('https://vimeo.com/40638487')
})

test('ia allowed event', () => {
  expect(utils.isAllowedEvent('video-start-time')).toBe(true)
})

test('is disallowed event', () => {
  expect(utils.isAllowedEvent('video-foo')).toBe(false)
})
