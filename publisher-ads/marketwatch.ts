import targetAdSlotsBySelector from './slotTargeting/by-selector'
import fetchAdCreatives from './creativeFetch/same-context'
import runOnPageLoaded from '../common/pageLifecycle/run-on-loaded'
import { GetAdSizesFunction } from './slotTargeting/'
import { AdSize } from './'

function stringToAdSize (sizeString: string): AdSize | null {
  const sizeData = sizeString.split('x')
  if (sizeData.length == 2) {
    return [Number(sizeData[0]), Number(sizeData[1])]
  }
  return null
}


runOnPageLoaded(function () {
  const getMarketWatchAdSizes: GetAdSizesFunction = (element: HTMLElement) => {
    const sizeData = element.getAttribute('data-size')
    if (sizeData) {
      const sizesByString: AdSize[] = sizeData.split(',')
        .map(stringToAdSize)
        .filter(item => item) as AdSize[]
      return sizesByString
    }
    return []
  }

  targetAdSlotsBySelector('.ad', getMarketWatchAdSizes, fetchAdCreatives)
})
