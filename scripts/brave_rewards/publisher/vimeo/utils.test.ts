import * as utils from './utils'

test('builds media key', () => {
  expect(utils.buildMediaKey('40638487')).toBe('vimeo_40638487')
})

test('builds publisher key', () => {
  expect(utils.buildPublisherKey('3425620')).toBe('vimeo#channel:3425620')
})

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
