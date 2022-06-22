import * as utils from './utils'

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { pathname: '/' }
  })
})

beforeEach(() => {
  location.pathname = '/'
  document.body.innerHTML = ''
})

function mock (pathname: string, html: string = '') {
  location.pathname = pathname
  document.body.innerHTML = html
}

test('getCurrentMediaId', () => {
  mock('/Foo/bar')
  expect(utils.getCurrentMediaId()).toBe('foo')

  // Video paths
  mock('/videos/123', `
    <a href='/Foo/bar'>
      <h1 class='tw-title'></h1>
    </a>
  `)
  expect(utils.getCurrentMediaId()).toBe('foo')

  mock('/videos/123', `
    <div>
      <h1 class='tw-title'></h1>
    </div>
  `)
  expect(utils.getCurrentMediaId()).toBe('')

  mock('/videos/123', '<h1 class=\'tw-title\'></h1>')
  expect(utils.getCurrentMediaId()).toBe('')

  mock('/videos/123', '<h1></h1>')
  expect(utils.getCurrentMediaId()).toBe('')

  // Excluded paths
  for (const path of utils.getExcludedPaths()) {
    mock(`/${path}`)
    expect(utils.getCurrentMediaId()).toBe('')
    mock(`/${path}/x`)
    expect(utils.getCurrentMediaId()).toBe('')
  }
})

test('getCurrentMediaKey', () => {
  expect(utils.getCurrentMediaKey('')).toBe('')
  expect(utils.getCurrentMediaKey('x')).toBe('twitch_x')

  mock('/videos')
  expect(utils.getCurrentMediaKey('x')).toBe('twitch_x')

  mock('/videos/12333323/0')
  expect(utils.getCurrentMediaKey('x')).toBe('twitch_x_void_12333323')
})

test('getPublisherKey', () => {
  expect(utils.getPublisherKey('')).toBe('')
  expect(utils.getPublisherKey('foo')).toBe('twitch#author:foo')
})

test('getCurrentPublisherInfo', () => {
  const defaultInfo = {
    favIconUrl: '',
    mediaId: '',
    mediaKey: '',
    publisherKey: 'www.twitch.tv',
    publisherName: 'www.twitch.tv',
    publisherUrl: 'https://www.twitch.tv'
  }

  mock('/')
  expect(utils.getCurrentPublisherInfo()).toEqual(defaultInfo)

  mock('/directory/esports')
  expect(utils.getCurrentPublisherInfo()).toEqual(defaultInfo)

  mock('/foo/bar', `
    <div class='channel-info-content'>
      <div class='tw-avatar'>
        <img src='__avatarUrl__' />
      </div>
    </div>
    <h1 class='tw-title'>Foo Gamer</h1>
  `)

  expect(utils.getCurrentPublisherInfo()).toEqual({
    favIconUrl: '__avatarUrl__',
    mediaId: 'foo',
    mediaKey: 'twitch_foo',
    publisherKey: 'twitch#author:foo',
    publisherName: 'Foo Gamer',
    publisherUrl: 'https://www.twitch.tv/foo'
  })
})
