import targetAdSlotsBySelector from './slotTargeting/by-selector'
import fetchAdCreatives from './creativeFetch/same-context'
import runOnPageLoaded from '../common/pageLifecycle/run-on-loaded'

function getSizeForWSJAdSlot (element: HTMLElement) {
  const adOptionsString = element.getAttribute('data-ad-options')
  if (!adOptionsString) {
    return null
  }
  const adOptions = JSON.parse(adOptionsString)
  if (!adOptions) {
    return null
  }
  return adOptions.adSize
}

runOnPageLoaded(function () {
  targetAdSlotsBySelector('[data-ad-options]', getSizeForWSJAdSlot, fetchAdCreatives)
})
