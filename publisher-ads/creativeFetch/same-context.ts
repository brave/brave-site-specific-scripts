import sendMessageToBrave from '../../common/contentScript/sendMessageToBrave'
// import slotFilteringAll from '../slotFiltering/all'
import BATAd from '../bat-ad'
import slotFilteringBest from '../slotFiltering/one-best-on-page'
import adFiltering from '../adSelecting'
import { PublisherAd, adSizeToString } from '../'

const slotFilterStrategy = slotFilteringBest

let accumulatorTimeoutId: number | null
let accumulations: BATAd[] = []
export default function adSlotReady (batAd: BATAd) {
  // accumulate so we can use a picking strategy
  accumulations.push(batAd)
  if (!accumulatorTimeoutId) {
    accumulatorTimeoutId = window.setTimeout(accumulationDone, 1000)
  }
}

function filterUnsuitableSizes (batAds: BATAd[]) {
  return batAds.filter(batAd => batAd.sizes.some(size => {
    if (size.length !== 2)
      return false
    const sizeTyped = [Number(size[0]), Number(size[1])]
    return (sizeTyped[0] > 200 && sizeTyped[1] > 70) ||
      (sizeTyped[1] > 200 && sizeTyped[0] > 70)
  }))
}

async function accumulationDone () {
  accumulatorTimeoutId = null
  let batAds = accumulations
  accumulations = []
  console.log(`BATSense: accumulator done, got ${batAds.length} slots`)
  batAds = filterUnsuitableSizes(batAds)
  console.log(`BATSense: got ${batAds.length} slots with useable size`)
  batAds = slotFilterStrategy(batAds)
  console.log(`BATSense: filter strategy done, got ${batAds.length} slots`, batAds)
  for (const batAd of batAds) {
    const ads: PublisherAd[] = await fetchCreativeFromBackend(batAd)
    if (!ads.length) {
      return
    }
    const adId = batAd.batAdId
    console.log('BATSense got response for ad', adId, ads)
    batAd.adToDisplay = adFiltering(ads)
  }
}

function fetchCreativeFromBackend (batAd: BATAd) {
  return new Promise<PublisherAd[]>((resolve, reject)  => {
    sendMessageToBrave(
      {
        type: 'ad-request',
        sizes: batAd.sizes.map(adSizeToString),
        isResponsive: batAd.isResponsive,
        url: window.location.href
      },
      (response) => {
        const { ads }: { ads: PublisherAd[] } = response
        resolve(ads)
      }
    )
  })
}
