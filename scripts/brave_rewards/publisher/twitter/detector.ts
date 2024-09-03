export const scriptText = `

(async function() {

  async function pollFor(fn, opts) {
    const startTime = Date.now()
    while (Date.now() - startTime < opts.timeout) {
      const result = fn()
      if (result) {
        return result
      }
      await new Promise((resolve) => setTimeout(resolve, opts.interval))
    }
    console.log('Polling timeout occurred')
    return null
  }

  function getElementStore(elem) {
    if (!elem) {
      return null
    }
    for (const name of Object.getOwnPropertyNames(elem)) {
      if (name.startsWith('__reactProps$')) {
        let store = null
        try { store = elem[name].children.props.store }
        catch {}
        if (store && typeof store.getState === 'function') {
          return store
        }
      }
    }
    return null
  }

  function findStore(elem, depth = 0) {
    if (!elem) {
      return null
    }
    let store = getElementStore(elem)
    if (store) {
      return store
    }
    if (depth === 4) {
      return null
    }
    for (let child of elem.children) {
      store = findStore(child, depth + 1)
      if (store) {
        return store
      }
    }
    return null
  }

  let stateStore = null

  function getStore() {
    if (!stateStore) {
      stateStore = findStore(document.getElementById('react-root'))
    }
    return stateStore
  }

  function getUserFromState(state, screenName) {
    const userEntities = state.entities.users.entities
    for (let [key, value] of Object.entries(userEntities)) {
      if (value.screen_name.toLocaleLowerCase() ===
          screenName.toLocaleLowerCase()) {
        return {
          siteID: key,
          imageURL: String(value.profile_image_url_https || '')
        }
      }
    }
    return null
  }

  function getUserByScreenName(screenName) {
    const store = getStore()
    if (!store) {
      return null
    }
    try {
      return getUserFromState(store.getState(), screenName)
    } catch (e) {
      console.error('Error attempting to get user state', e)
    }
    return null
  }

  function getScreenNameFromPath(path) {
    let match = path.match(/^\\/([^\\/]+)(\\/|\\/status\\/[\\s\\S]+)?$/)
    if (match) {
      return match[1]
    }
    return null
  }

  function getUserFromPath(path) {
    const screenName = getScreenNameFromPath(path)
    if (screenName) {
      const user = getUserByScreenName(screenName)
      if (user) {
        return user
      }
    }
    return null
  }

  const user = await pollFor(() => getUserFromPath(location.pathname), {
    interval: 600,
    timeout: 8000
  })

  document.dispatchEvent(new CustomEvent('rewards-publisher-detected', {
    detail: { user }
  }))

})()

`
