import targetAdSlotsBySelector from './slotTargeting/by-selector'
import fetchAdCreatives from './creativeFetch/same-context'
import runOnPageLoaded from '../common/pageLifecycle/run-on-loaded'
import { GetAdSizesFunction } from './slotTargeting/'
import { AdSize, stringToAdSize } from './'

const getSizeForMarketWatchAdSlot: GetAdSizesFunction = (element: HTMLElement) => {
  const sizeData = element.getAttribute('data-size')
  if (sizeData) {
    const sizesByString: AdSize[] = sizeData.split(',')
      .map(stringToAdSize)
      .filter(item => item) as AdSize[]
    return sizesByString
  }
  return []
}

runOnPageLoaded(function () {
  targetAdSlotsBySelector('.ad', getSizeForMarketWatchAdSlot, fetchAdCreatives)
})
